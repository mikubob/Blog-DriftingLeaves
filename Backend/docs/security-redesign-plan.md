# DriftingLeaves 安全架构改造规划

## 1. 现状与问题

### 1.1 当前架构

当前项目采用**自定义 JWT + HttpOnly Cookie + Redis 白名单**的方案：

- 认证：[`JwtTokenAdminInterceptor`](../../DL-server/src/main/java/com/xuan/interceptor/JwtTokenAdminInterceptor.java) 拦截 `/admin/**`，从 Cookie 读取 token
- 鉴权：拦截器内硬编码判断 `role == 0 && !GET` 限制游客只读
- 登录：[`AdminServiceImpl.login()`](../../DL-server/src/main/java/com/xuan/service/impl/AdminServiceImpl.java) 手写密码、验证码、登录锁定逻辑
- Token：[`TokenServiceImpl`](../../DL-server/src/main/java/com/xuan/service/impl/TokenServiceImpl.java) 用 JWT + Redis Set 维护白名单与多设备上限
- Cookie：[`AdminController`](../../DL-server/src/main/java/com/xuan/controller/admin/AdminController.java) 手动拼接 `Set-Cookie` 响应头

### 1.2 主要问题

| 问题 | 说明 |
|------|------|
| 鉴权逻辑硬编码 | 游客只读、角色判断写在拦截器里，后续新增角色或方法级权限会难以维护 |
| 游客与普通用户体系缺失 | 当前只有 `admin` 表，博客评论/留言等功能没有登录用户概念，匿名评论难以追溯 |
| 安全特性不完善 | 缺少统一的安全响应头、CSRF 策略、方法级安全、标准密码编码器 |
| 测试困难 | 无法使用 `@WithMockUser` 等标准测试工具，接口测试需要构造真实 JWT Cookie |
| 扩展成本高 | 未来接入 OAuth2/SSO、细粒度 RBAC 时，自定义方案需要大量重构 |

## 2. 改造目标

1. **引入 Spring Security** 作为统一的安全框架，但保留现有 JWT + Redis 白名单的核心机制（渐进式改造）
2. **建立用户体系**：区分匿名用户、登录用户、管理员，支持用户注册/登录
3. **实现方法级权限控制**：使用 `@PreAuthorize` 替代硬编码角色判断
4. **统一博客端登录能力**：评论、留言等操作要求登录用户才能执行
5. **提升可测试性与可审计性**：便于单元测试和安全审计

## 3. 整体架构设计

### 3.1 分层架构

```text
┌─────────────────────────────────────────────────────────────┐
│                         前端层                               │
│  Frontend-Admin  │  Frontend-Blog  │  Frontend-Cv           │
│  (管理员后台)     │  (博客端，新增登录/注册) │  (简历页)        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Axios withCredentials
┌──────────────────────▼──────────────────────────────────────┐
│                      网关/控制层                             │
│  Spring Security Filter Chain                               │
│  ├── JwtAuthenticationFilter (从 Cookie 读取 JWT)           │
│  ├── OAuth2LoginAuthenticationFilter (预留第三方登录)        │
│  └── ExceptionTranslationFilter (统一 401/403)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Authentication
┌──────────────────────▼──────────────────────────────────────┐
│                      认证层                                  │
│  UserDetailsService  │  JwtAuthenticationProvider           │
│  PasswordEncoder(BCrypt)  │  TokenService (Redis 白名单)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      业务层                                  │
│  @PreAuthorize 方法级鉴权                                   │
│  角色：ROLE_ANONYMOUS / ROLE_USER / ROLE_VISITOR / ROLE_ADMIN│
└─────────────────────────────────────────────────────────────┘
```

### 3.2 认证流程

#### 管理员登录（保留现有流程）

```text
POST /admin/admin/login
  ↓
AdminService.login() 校验用户名、密码、验证码
  ↓
TokenService.createAndStoreToken() 生成 JWT 并存入 Redis
  ↓
Controller 写入 HttpOnly Cookie
  ↓
后续请求由 JwtAuthenticationFilter 校验 Cookie 中的 JWT
```

#### 博客用户登录（新增）

```text
POST /blog/auth/login
  ↓
UserService.login() 校验用户名、密码
  ↓
TokenService.createAndStoreToken() 生成 JWT 并存入 Redis
  ↓
Controller 写入 HttpOnly Cookie
  ↓
评论/留言等接口要求 ROLE_USER 才能访问
```

#### 第三方登录（预留）

```text
GET /blog/oauth2/authorization/github
  ↓
Spring Security OAuth2 Client 处理回调
  ↓
创建或绑定本地用户
  ↓
生成 JWT 并写入 Cookie
```

### 3.3 授权模型

采用基于角色的访问控制（RBAC）：

| 角色 | 权限说明 |
|------|---------|
| `ROLE_ANONYMOUS` | 未登录用户，只能浏览公开内容 |
| `ROLE_USER` | 登录用户，可以评论、留言、订阅 RSS |
| `ROLE_VISITOR` | 后台游客账号，仅允许 GET 查询 |
| `ROLE_ADMIN` | 后台管理员，拥有所有管理权限 |

权限表达式示例：

```java
// 仅管理员可访问
@PreAuthorize("hasRole('ADMIN')")

// 游客只读，管理员可写
@PreAuthorize("hasRole('ADMIN') or (hasRole('VISITOR') and hasAuthority('READ_ONLY'))")

// 登录用户可评论
@PreAuthorize("hasRole('USER')")

// 允许匿名访问（用于公开接口）
@PermitAll
```

## 4. 数据库表重新设计

### 4.1 新增表

#### 4.1.1 `sys_user`（普通用户表）

用于博客端登录用户。

```sql
CREATE TABLE sys_user (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username        VARCHAR(64)  NOT NULL UNIQUE COMMENT '用户名',
    nickname        VARCHAR(64)           COMMENT '昵称',
    email           VARCHAR(128)          COMMENT '邮箱',
    password        VARCHAR(255)          COMMENT '密码（BCrypt加密，第三方登录可为空）',
    avatar          VARCHAR(512)          COMMENT '头像URL',
    status          TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
    login_type      TINYINT      NOT NULL DEFAULT 1 COMMENT '登录类型：1本地 2GitHub 3Gitee',
    oauth_id        VARCHAR(128)          COMMENT '第三方平台用户ID',
    oauth_provider  VARCHAR(32)           COMMENT '第三方平台标识',
    create_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_oauth (oauth_provider, oauth_id)
) COMMENT '博客用户表';
```

#### 4.1.2 `sys_role`（角色表）

```sql
CREATE TABLE sys_role (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code   VARCHAR(64)  NOT NULL UNIQUE COMMENT '角色编码：ADMIN/USER/VISITOR',
    role_name   VARCHAR(64)  NOT NULL COMMENT '角色名称',
    description VARCHAR(255) COMMENT '描述'
) COMMENT '角色表';

INSERT INTO sys_role (role_code, role_name) VALUES
('ADMIN', '管理员'),
('USER', '普通用户'),
('VISITOR', '后台游客');
```

#### 4.1.3 `sys_user_role`（用户角色关联表）

支持一个用户多个角色。

```sql
CREATE TABLE sys_user_role (
    id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID（admin 或 sys_user）',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    user_type TINYINT NOT NULL DEFAULT 1 COMMENT '用户类型：1博客用户 2管理员',
    UNIQUE KEY uk_user_role (user_id, role_id, user_type)
) COMMENT '用户角色关联表';
```

### 4.2 改造现有表

#### 4.2.1 `admin` 表

当前 `admin` 表需要与新的角色体系打通：

```sql
-- 将现有管理员数据同步到 sys_user_role 中
INSERT INTO sys_user_role (user_id, role_id, user_type)
SELECT a.id, r.id, 2
FROM admin a
JOIN sys_role r ON r.role_code = CASE
    WHEN a.role = 1 THEN 'ADMIN'
    WHEN a.role = 0 THEN 'VISITOR'
END;

-- 可选：移除 admin.role 字段，改为完全依赖 sys_user_role
-- ALTER TABLE admin DROP COLUMN role;
```

> **建议保留 `admin.role` 字段作为冗余**，改造期间双写，待稳定后再移除。

#### 4.2.2 `article_comments` 表

增加用户关联字段，将匿名评论迁移到登录评论。

```sql
ALTER TABLE article_comments
    ADD COLUMN user_id BIGINT COMMENT '评论用户ID（sys_user.id）',
    ADD COLUMN user_type TINYINT NOT NULL DEFAULT 1 COMMENT '用户类型：1匿名 2登录用户',
    ADD COLUMN is_secret TINYINT NOT NULL DEFAULT 0 COMMENT '是否悄悄话：1是 0否',
    ADD INDEX idx_user_id (user_id);
```

> 当前 `is_secret` 字段已存在但无消费逻辑，本次改造应实现其业务含义：悄悄话仅对评论者和博主可见。

#### 4.2.3 `messages` 表

留言板同样增加用户关联。

```sql
ALTER TABLE messages
    ADD COLUMN user_id BIGINT COMMENT '留言用户ID（sys_user.id）',
    ADD COLUMN user_type TINYINT NOT NULL DEFAULT 1 COMMENT '用户类型：1匿名 2登录用户',
    ADD COLUMN is_secret TINYINT NOT NULL DEFAULT 0 COMMENT '是否悄悄话',
    ADD INDEX idx_user_id (user_id);
```

## 5. 后端代码改造清单

### 5.1 新增模块/类

| 文件 | 说明 |
|------|------|
| `DL-server/config/SecurityConfig.java` | Spring Security 核心配置，定义 FilterChain、放行规则 |
| `DL-server/security/JwtAuthenticationFilter.java` | 从 Cookie 提取 JWT 并构建 Authentication |
| `DL-server/security/JwtAuthenticationProvider.java` | 校验 JWT + Redis 白名单 |
| `DL-server/security/CustomUserDetailsService.java` | 加载用户详情（合并 admin 和 sys_user） |
| `DL-server/security/CustomAuthenticationEntryPoint.java` | 未认证时返回 401 |
| `DL-server/security/CustomAccessDeniedHandler.java` | 无权限时返回 403 |
| `DL-server/security/SecurityUser.java` | 实现 UserDetails，封装用户ID、角色、用户类型 |
| `DL-common/utils/CookieUtil.java` | 统一封装 HttpOnly Cookie 读写 |

### 5.2 改造现有类

| 文件 | 改造内容 |
|------|---------|
| `JwtTokenAdminInterceptor.java` | **废弃**，逻辑迁移到 `JwtAuthenticationFilter` |
| `WebMvcConfiguration.java` | 移除拦截器注册，CORS 配置保留或迁移到 SecurityConfig |
| `AdminController.java` | 使用 `CookieUtil` 写入 Cookie；登录成功返回不含 token 的 VO |
| `AdminServiceImpl.java` | 密码校验改为 `BCryptPasswordEncoder`；兼容历史密码哈希 |
| `TokenServiceImpl.java` | 保留 JWT 生成与 Redis 白名单，支持按用户类型区分 key |
| `ArticleCommentController.java` | 评论接口增加 `@PreAuthorize("hasRole('USER')")` |
| `MessageController.java` | 留言接口增加 `@PreAuthorize("hasRole('USER')")` |
| `ArticleCommentServiceImpl.java` | 评论查询时处理 `is_secret` 可见性逻辑 |
| `MessageServiceImpl.java` | 留言查询时处理 `is_secret` 可见性逻辑 |

### 5.3 密码迁移策略

由于历史密码使用自定义 `hashPassword(password, salt)`，不能直接替换为 BCrypt。建议策略：

1. **双轨验证**：登录时先判断密码格式，BCrypt 格式用 `BCryptPasswordEncoder`，旧格式用原 `EncryptPasswordService`
2. **登录即升级**：旧密码验证通过后，使用 `BCryptPasswordEncoder` 重新加密并更新数据库
3. **最终弃用**：运行一段时间后，所有活跃用户完成迁移，移除旧逻辑

伪代码：

```java
public boolean matches(String rawPassword, String encodedPassword) {
    if (encodedPassword.startsWith("$2a$")) {
        return bCryptPasswordEncoder.matches(rawPassword, encodedPassword);
    }
    // 旧格式：customHash(rawPassword, salt).equals(encodedPassword)
    return legacyPasswordService.matches(rawPassword, encodedPassword);
}
```

## 6. 前端改造清单

### 6.1 博客端新增页面

- 登录页 `/login`
- 注册页 `/register`
- 个人中心 `/profile`（可选）

### 6.2 评论/留言组件改造

- 未登录用户看到"登录后评论"提示
- 登录后显示当前用户信息，提供"悄悄话"选项
- 悄悄话仅对评论者和博主可见

### 6.3 请求层

- 博客端 request 实例同样配置 `withCredentials: true`
- 统一处理 401（跳转登录）、403（提示权限不足）

## 7. 关键业务逻辑设计

### 7.1 评论/留言登录限制

```java
@RestController
@RequestMapping("/blog/comment")
public class ArticleCommentController {

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public Result addComment(@RequestBody ArticleCommentDTO dto,
                             @AuthenticationPrincipal SecurityUser user) {
        dto.setUserId(user.getUserId());
        dto.setUserType(2); // 登录用户
        articleCommentService.addComment(dto);
        return Result.success();
    }
}
```

### 7.2 悄悄话可见性

```java
// 在 Service 层过滤
private boolean canSeeSecret(ArticleCommentVO comment, Long currentUserId) {
    if (!comment.getIsSecret()) {
        return true;
    }
    // 悄悄话：仅博主（管理员）和评论者本人可见
    return isAdmin(currentUserId) || Objects.equals(comment.getUserId(), currentUserId);
}
```

### 7.3 游客后台只读

```java
@PreAuthorize("hasRole('ADMIN') or (hasRole('VISITOR') and hasAuthority('READ_ONLY'))")
```

或更简洁地用自定义 PermissionEvaluator 实现。

## 8. 实施步骤建议

建议按以下阶段推进，每阶段结束后测试通过再进入下一阶段：

### 第一阶段：基础设施（约 3~5 天）

1. 引入 `spring-boot-starter-security` 依赖
2. 创建 `SecurityConfig`、`SecurityUser`、`CustomUserDetailsService`
3. 将 `JwtTokenAdminInterceptor` 改造为 `JwtAuthenticationFilter` 接入 Spring Security
4. 验证管理员后台登录、登出、Token 校验仍然正常

### 第二阶段：角色体系（约 3~5 天）

1. 新增 `sys_role`、`sys_user_role` 表
2. 将 `admin` 表角色同步到 `sys_user_role`
3. 实现 `UserDetails` 中的角色加载
4. 在关键后台接口试用 `@PreAuthorize`

### 第三阶段：博客用户体系（约 5~7 天）

1. 新增 `sys_user` 表
2. 实现博客端注册/登录接口
3. 新增博客端 `CookieUtil` 支持区分 `admin_token` 和 `user_token`
4. 改造评论/留言接口要求登录
5. 前端博客端新增登录/注册页面

### 第四阶段：密码迁移与收尾（约 3~5 天）

1. 引入 `BCryptPasswordEncoder`
2. 实现双轨密码验证 + 登录升级
3. 补充单元测试（`@WithMockUser`）
4. 清理废弃的 `JwtTokenAdminInterceptor` 和旧密码逻辑

## 9. 风险与注意事项

| 风险 | 应对措施 |
|------|---------|
| 改造成本超出预期 | 采用渐进式改造，先接入 Spring Security 再逐步迁移业务 |
| 历史密码不兼容 | 双轨验证 + 登录自动升级 |
| Token 冲突 | 管理端和博客端使用不同 Cookie 名称（如 `admin_token` / `user_token`） |
| 前端登录体验 | 提供清晰的登录态提示和 401 跳转 |
| 第三方登录回调 | 预留 OAuth2 Client 配置，暂不实现具体 Provider |

## 10. 总结

本次改造的核心不是推翻现有 JWT + Redis 白名单机制，而是**用 Spring Security 包裹现有机制**，逐步实现：

1. 统一的过滤器链认证
2. 声明式方法级鉴权
3. 博客端用户登录体系
4. 评论/留言登录限制
5. 悄悄话等功能的真正落地

这样可以在控制风险的前提下，显著提升项目的安全性、可维护性和扩展性。
