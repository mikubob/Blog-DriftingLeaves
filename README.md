# DriftingLeaves (飘叶)

一个现代化的个人博客网站系统，采用前后端分离架构，支持多站点部署。

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green.svg)](https://spring.io/projects/spring-boot)
[![Vue](https://img.shields.io/badge/Vue-3.5.x-brightgreen.svg)](https://vuejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**[在线演示](https://driftingleaves.xyz)** | **[项目源码](https://github.com/mikubob/Blog-DriftingLeaves)**

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [Docker 部署](#docker-部署)
- [API 文档](#api-文档)
- [安全特性](#安全特性)
- [性能优化](#性能优化)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目简介

DriftingLeaves 是一个功能完整的个人博客系统，包含主站、博客、简历和管理后台四个子站点。系统采用 Spring Boot 3 + Vue 3 技术栈开发，支持 Docker 容器化部署。

### 子站点说明

| 站点 | 说明 | 演示地址 |
|------|------|----------|
| **Home** | 个人主页，展示个人信息和社交媒体链接 | [driftingleaves.xyz](https://driftingleaves.xyz) |
| **Blog** | 博客系统，支持文章发布、评论、RSS 订阅等 | [blog.driftingleaves.xyz](https://blog.driftingleaves.xyz) |
| **CV** | 在线简历，展示教育经历、工作经历和技能 | [cv.driftingleaves.xyz](https://cv.driftingleaves.xyz) |
| **Admin** | 管理后台，管理所有内容和数据 | [admin.driftingleaves.xyz](https://admin.driftingleaves.xyz) |

## 功能特性

### 主站 (Home)
- 个人信息展示（昵称、标签、简介、头像）
- 社交媒体链接（GitHub、邮箱、个人网站等）
- 访客统计与识别

### 博客 (Blog)
- 📝 **文章管理**
  - Markdown 编辑与渲染
  - 文章分类与标签
  - 文章置顶与归档
  - 文章搜索（全文索引）
  - 阅读量与点赞统计
- 💬 **评论系统**
  - 多级评论与回复
  - Markdown 支持
  - 评论审核机制
  - 邮件通知
- 📡 **订阅功能**
  - RSS 订阅
  - Sitemap 生成
- 🔗 **其他功能**
  - 友情链接
  - 留言板
  - 背景音乐播放

### 简历 (CV)
- 📚 教育经历展示
- 💼 工作/实习经历展示
- 🚀 项目经历展示
- 🛠️ 技能展示

### 管理后台 (Admin)
- 📊 **数据看板**
  - 访问统计报表
  - 文章浏览排行
  - 访客地理分布
  - 实时在线人数
- 📝 **内容管理**
  - 文章增删改查
  - 分类与标签管理
  - 评论审核
  - 留言审核
- 👥 **访客管理**
  - 访客列表查看
  - 访客封禁/解封
  - 访问记录追踪
- ⚙️ **系统管理**
  - 个人信息管理
  - 系统配置
  - 操作日志
  - 友链管理
  - 音乐管理
  - RSS 订阅管理

## 技术栈

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 21 | JDK 版本（支持虚拟线程） |
| Spring Boot | 3.x | 基础框架 |
| Spring Security | - | 安全框架 |
| MyBatis-Plus | - | ORM 框架 |
| MySQL | 8.0+ | 关系型数据库 |
| Redis | 6.0+ | 缓存数据库 |
| Druid | - | 数据库连接池 |
| JWT | - | 身份认证 |
| Hutool | - | Java 工具库 |
| FastJSON2 | - | JSON 处理 |
| CommonMark | - | Markdown 解析 |
| 阿里云 OSS | - | 对象存储 |
| Spring Mail | - | 邮件服务 |
| ip2region | - | IP 地址解析 |
| Thumbnailator | - | 图片压缩 |
| WebP ImageIO | - | WebP 格式支持 |

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.x | 渐进式 JavaScript 框架 |
| Vite | 7.x | 下一代前端构建工具 |
| Vue Router | 4.x | 路由管理 |
| Pinia | 3.x | 状态管理（支持持久化） |
| Element Plus | 2.x | UI 组件库 |
| Axios | - | HTTP 客户端 |
| ECharts | 5.x | 数据可视化（管理后台） |
| md-editor-v3 | 6.x | Markdown 编辑器 |
| Sass | - | CSS 预处理器 |
| unplugin-icons | - | 图标自动导入 |

### 部署

| 技术 | 说明 |
|------|------|
| Docker | 容器化部署 |
| Docker Compose | 多容器编排 |
| Nginx | 反向代理与静态资源服务 |
| 宝塔面板 | 服务器管理（可选） |

## 项目结构

```
DriftingLeaves-Website/
├── Backend/                          # 后端项目
│   ├── DL-common/                   # 公共模块
│   │   └── src/main/java/com/xuan/
│   │       ├── constant/            # 常量定义
│   │       ├── context/             # 上下文
│   │       ├── enumeration/         # 枚举类
│   │       ├── exception/           # 自定义异常
│   │       ├── json/                # JSON 配置
│   │       ├── properties/          # 配置属性类
│   │       ├── result/              # 统一返回结果
│   │       └── utils/               # 工具类
│   ├── DL-pojo/                     # 实体模块
│   │   └── src/main/java/com/xuan/
│   │       ├── dto/                 # 数据传输对象
│   │       ├── entity/              # 数据库实体
│   │       └── vo/                  # 视图对象
│   └── DL-server/                   # 服务模块
│       └── src/main/
│           ├── java/com/xuan/
│           │   ├── annotation/      # 自定义注解
│           │   ├── aspect/          # AOP 切面
│           │   ├── config/          # 配置类
│           │   ├── controller/      # 控制器
│           │   │   ├── admin/       # 管理端接口
│           │   │   ├── blog/        # 博客接口
│           │   │   ├── cv/          # 简历接口
│           │   │   ├── health/      # 健康检查
│           │   │   └── home/        # 主站接口
│           │   ├── handle/          # 处理器
│           │   ├── interceptor/     # 拦截器
│           │   ├── mapper/          # MyBatis Mapper
│           │   ├── service/         # 服务层
│           │   ├── task/            # 定时任务
│           │   └── websocket/       # WebSocket
│           └── resources/
│               ├── lua/             # Lua 脚本
│               ├── mapper/          # Mapper XML
│               ├── sql/             # 数据库脚本
│               └── application.yml.template  # 配置模板
├── Frontend-Admin/                  # 管理后台前端
├── Frontend-Blog/                   # 博客前端
├── Frontend-Home/                   # 主站前端
├── Frontend-Cv/                     # 简历前端
├── DockerForDriftingLeaves/         # Docker 部署配置
│   ├── docker-compose.yml           # Docker Compose 配置
│   ├── Dockerfile                   # 后端镜像构建文件
│   ├── nginx/                       # Nginx 配置
│   │   └── nginx.conf
│   └── Deploy.md                    # 部署文档
├── README.md
└── CONTRIBUTING.md
```

## 快速开始

### 环境要求

#### 后端
- JDK 21+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+

#### 前端
- Node.js 20.19.0+ 或 22.12.0+
- pnpm（推荐）或 npm

### 后端启动

1. **克隆项目**
   ```bash
   git clone https://github.com/mikubob/Blog-DriftingLeaves.git
   cd Blog-DriftingLeaves
   ```

2. **创建数据库**
   ```sql
   CREATE DATABASE driftingleaves CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **执行数据库脚本**
   执行 `Backend/DL-server/src/main/resources/sql/sql.sql` 中的 SQL 语句

4. **生成管理员密码**
   项目使用加盐加密存储密码，需要运行测试类生成加密后的密码：
   ```java
   // 在测试类中生成密码
   String password = "your-password";
   String salt = "your-salt";
   String encryptedPassword = EncryptPasswordService.encrypt(password, salt);
   System.out.println("加密后的密码: " + encryptedPassword);
   ```

5. **配置应用**
   ```bash
   cd Backend/DL-server/src/main/resources
   cp application.yml.template application.yml
   cp application-dev.yml.template application-dev.yml
   ```

6. **启动后端**
   ```bash
   cd Backend
   mvn clean install -DskipTests
   java -jar DL-server/target/DriftingLeaves.jar
   ```
   
   后端服务将在 `5922` 端口启动。

### 前端启动

1. **安装依赖**
   ```bash
   cd Frontend-Admin  # 或 Frontend-Blog、Frontend-Home、Frontend-Cv
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm dev
   ```

3. **构建生产版本**
   ```bash
   pnpm build
   ```

## 配置说明

### 后端配置项

| 配置项 | 说明 | 必填 |
|--------|------|------|
| `spring.datasource.*` | MySQL 数据库连接信息 | ✅ |
| `spring.data.redis.*` | Redis 连接信息 | ✅ |
| `dl.jwt.secret-key` | JWT 密钥（建议 32 位以上随机字符串） | ✅ |
| `dl.jwt.ttl` | JWT 过期时间（毫秒） | ✅ |
| `dl.alioss.*` | 阿里云 OSS 配置 | ✅ |
| `spring.mail.*` | 邮箱 SMTP 配置 | ✅ |
| `dl.email.personal` | 邮件发送者昵称 | ✅ |
| `dl.email.from` | 邮件发送者邮箱 | ✅ |
| `dl.visitor.verify-code` | 游客登录验证码 | ❌ |
| `dl.image.compress.*` | 图片压缩配置 | ❌ |
| `dl.website.*` | 网站信息配置 | ✅ |

### 前端配置

前端开发服务器默认代理到 `http://localhost:5922`，可在 `vite.config.js` 中修改：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5922',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## Docker 部署

详细部署说明请参阅 [DockerForDriftingLeaves/Deploy.md](DockerForDriftingLeaves/Deploy.md)。

### 快速部署

1. **准备文件**
   ```bash
   # 前端打包
   cd Frontend-Admin && pnpm build
   cp -r dist ../DockerForDriftingLeaves/html/Admin/
   
   # 后端打包
   cd Backend && mvn clean package -DskipTests
   cp DL-server/target/DriftingLeaves.jar ../DockerForDriftingLeaves/backend/
   ```

2. **配置 SSL 证书**
   将各域名证书放入 `DockerForDriftingLeaves/SSL/` 对应目录

3. **创建网络并启动**
   ```bash
   docker network create driftingleaves
   cd DockerForDriftingLeaves
   docker-compose up -d
   ```

### 域名配置

| 域名 | 用途 | Nginx 配置 |
|------|------|------------|
| driftingleaves.xyz | 主站 | html/Home/dist |
| admin.driftingleaves.xyz | 管理后台 | html/Admin/dist |
| blog.driftingleaves.xyz | 博客 | html/Blog/dist |
| cv.driftingleaves.xyz | 简历 | html/CV/dist |

## API 文档

### API 端点

| 端点 | 说明 | 认证 |
|------|------|------|
| `/admin/**` | 管理端接口 | JWT Token |
| `/blog/**` | 博客公开接口 | 无 |
| `/home/**` | 主站公开接口 | 无 |
| `/cv/**` | 简历公开接口 | 无 |
| `/health` | 健康检查 | 无 |

### 主要接口示例

```bash
# 获取文章列表
GET /blog/article/list?page=1&size=10

# 获取文章详情
GET /blog/article/{slug}

# 获取 RSS 订阅
GET /blog/rss

# 获取 Sitemap
GET /blog/sitemap.xml

# 管理员登录
POST /admin/admin/login
Content-Type: application/json
{
  "username": "admin",
  "password": "password",
  "code": "verify-code"
}
```

## 安全特性

- **身份认证**：JWT Token 认证机制
- **密码加密**：加盐哈希加密存储
- **限流保护**：基于令牌桶算法的接口限流
- **XSS 防护**：Markdown 内容 XSS 过滤
- **CORS 配置**：跨域请求安全配置
- **SQL 注入防护**：MyBatis-Plus 参数化查询

### 限流注解使用

```java
@PostMapping("/login")
@RateLimit(type = RateLimit.Type.IP, tokens = 5, burstCapacity = 8, 
           timeWindow = 60, message = "操作过于频繁，请稍后再试")
public Result<AdminLoginVO> login(@RequestBody AdminLoginDTO dto) {
    // ...
}
```

## 性能优化

### 后端优化
- **虚拟线程**：启用 Java 21 虚拟线程，提升 I/O 密集型操作性能
- **异步处理**：邮件发送、日志记录等异步执行
- **Redis 缓存**：热点数据缓存，减少数据库压力
- **连接池**：Druid 连接池优化数据库连接
- **定时同步**：点赞数、浏览数定时同步到数据库

### 前端优化
- **代码分割**：按模块分割打包，减少首屏加载时间
- **组件懒加载**：路由级别代码分割
- **资源压缩**：Terser 压缩，移除 console 和 debugger
- **CDN 缓存**：静态资源 30 天缓存
- **Gzip 压缩**：Nginx 开启 Gzip 压缩

## 常见问题

### Q: 后端启动报数据库连接失败？
A: 检查 MySQL 服务是否启动，数据库是否创建，配置文件中的连接信息是否正确。

### Q: 前端开发服务器无法访问后端 API？
A: 确保后端服务在 5922 端口启动，检查 vite.config.js 中的代理配置。

### Q: 管理员密码如何生成？
A: 项目使用加盐加密，需要在测试类中调用加密方法生成密码，然后插入数据库。

### Q: 图片上传失败？
A: 检查阿里云 OSS 配置是否正确，Bucket 是否存在，是否有写入权限。

### Q: 邮件发送失败？
A: 检查邮箱 SMTP 配置，确保使用的是邮箱授权码而非登录密码。

## 贡献指南

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

## 许可证

本项目采用 MIT 许可证。
