# 贡献指南

感谢您有兴趣为 DriftingLeaves 项目做出贡献！本文档将帮助您了解如何参与项目开发。

**项目地址**: [https://github.com/mikubob/Blog-DriftingLeaves](https://github.com/mikubob/Blog-DriftingLeaves)

**在线演示**: [https://driftingleaves.xyz](https://driftingleaves.xyz)

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境搭建](#开发环境搭建)
- [项目架构](#项目架构)
- [项目规范](#项目规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [开发建议](#开发建议)
- [获取帮助](#获取帮助)

## 行为准则

- 尊重所有贡献者
- 接受建设性批评
- 关注对项目最有利的事情
- 对社区保持友善和包容

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请通过 GitHub Issues 提交，并包含以下信息：

1. **Bug 描述**：清晰简洁地描述问题
2. **复现步骤**：详细的复现步骤
3. **预期行为**：您期望发生什么
4. **实际行为**：实际发生了什么
5. **环境信息**：
   - 操作系统
   - Java 版本
   - Node.js 版本
   - 浏览器版本（如果是前端问题）
6. **截图**：如果适用，添加截图帮助解释问题
7. **日志**：相关的错误日志

### 提出新功能

如果您有新功能的想法，请通过 GitHub Issues 提交：

1. **功能描述**：清晰描述您希望添加的功能
2. **使用场景**：描述这个功能的使用场景
3. **实现建议**：如果您有实现思路，欢迎分享
4. **替代方案**：是否有其他可行的实现方式

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 开发环境搭建

### 后端开发环境

**环境要求：**
- JDK 21+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- IDE（推荐 IntelliJ IDEA）

**搭建步骤：**

1. 克隆项目
   ```bash
   git clone https://github.com/mikubob/Blog-DriftingLeaves.git
   cd Blog-DriftingLeaves/Backend
   ```

2. 创建数据库并执行 SQL 脚本
   ```sql
   CREATE DATABASE driftingleaves CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE driftingleaves;
   -- 执行 DL-server/src/main/resources/sql/sql.sql
   ```

3. 配置应用
   ```bash
   cd DL-server/src/main/resources
   cp application.yml.template application.yml
   cp application-dev.yml.template application-dev.yml
   # 编辑配置文件，填入必要配置
   ```

4. 使用 IDE 打开项目
   - 使用 IntelliJ IDEA 打开 `Backend` 目录
   - 等待 Maven 自动下载依赖
   - 运行 `DriftingLeavesApplication.java`

### 前端开发环境

**环境要求：**
- Node.js 20.19.0+ 或 22.12.0+
- pnpm（推荐）

**搭建步骤：**

1. 安装 pnpm（如果未安装）
   ```bash
   npm install -g pnpm
   ```

2. 进入前端项目目录
   ```bash
   cd Frontend-Admin  # 或 Frontend-Blog、Frontend-Home、Frontend-Cv
   ```

3. 安装依赖
   ```bash
   pnpm install
   ```

4. 启动开发服务器
   ```bash
   pnpm dev
   ```

## 项目架构

### 后端架构

项目采用分层架构，分为三个模块：

```
Backend/
├── DL-common/           # 公共模块
│   ├── constant/        # 常量定义
│   ├── context/         # 上下文（如用户上下文）
│   ├── enumeration/     # 枚举类
│   ├── exception/       # 自定义异常
│   ├── json/            # JSON 配置
│   ├── properties/      # 配置属性类
│   ├── result/          # 统一返回结果
│   └── utils/           # 工具类
├── DL-pojo/             # 实体模块
│   ├── dto/             # 数据传输对象
│   ├── entity/          # 数据库实体
│   └── vo/              # 视图对象
└── DL-server/           # 服务模块
    ├── annotation/      # 自定义注解
    ├── aspect/          # AOP 切面
    ├── config/          # 配置类
    ├── controller/      # 控制器
    ├── handle/          # 处理器（全局异常、元数据填充）
    ├── interceptor/     # 拦截器
    ├── mapper/          # MyBatis Mapper
    ├── service/         # 服务层
    ├── task/            # 定时任务
    └── websocket/       # WebSocket
```

### 数据库表结构

| 表名 | 说明 |
|------|------|
| `admin` | 管理员表 |
| `operation_logs` | 操作日志表 |
| `system_config` | 系统配置表 |
| `personal_info` | 个人信息表 |
| `social_media` | 社交媒体表 |
| `experiences` | 经历表（教育、工作、项目） |
| `skills` | 技能表 |
| `visitors` | 访客表 |
| `views` | 浏览记录表 |
| `articles` | 文章表 |
| `article_categories` | 文章分类表 |
| `article_tags` | 文章标签表 |
| `article_tag_relations` | 文章标签关联表 |
| `article_comments` | 文章评论表 |
| `article_likes` | 文章点赞表 |
| `rss_subscriptions` | RSS 订阅表 |
| `friend_links` | 友情链接表 |
| `messages` | 留言表 |
| `music` | 音乐表 |

### 前端架构

各前端项目采用相似的架构：

```
Frontend-xxx/
├── public/              # 静态资源
│   ├── favicon.ico      # 网站图标
│   └── robots.txt       # 爬虫配置（Blog）
├── src/
│   ├── api/             # API 接口封装
│   ├── assets/          # 资源文件
│   │   ├── emjio/       # 表情包（Admin、Blog）
│   │   ├── font/        # 字体文件
│   │   ├── icon/        # 图标文件
│   │   └── styles/      # 样式文件
│   ├── components/      # 公共组件
│   ├── composables/     # 组合式函数
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia 状态管理
│   │   └── modules/     # 状态模块
│   ├── utils/           # 工具函数
│   ├── view/            # 页面组件
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── index.html           # HTML 模板
├── package.json         # 项目配置
├── vite.config.js       # Vite 配置
└── jsconfig.json        # JS 配置
```

## 项目规范

### 后端代码规范

**命名规范：**
- 类名：大驼峰命名法（如 `ArticleService`）
- 方法名：小驼峰命名法（如 `getArticleById`）
- 常量：全大写下划线分隔（如 `MAX_PAGE_SIZE`）
- 包名：全小写（如 `com.xuan.service`）
- 接口以 `I` 开头（如 `IArticleService`）
- 实现类以 `Impl` 结尾（如 `ArticleServiceImpl`）

**注释规范：**
- 类和接口必须有 Javadoc 注释
- 公共方法必须有 Javadoc 注释
- 复杂逻辑必须有行内注释

**Controller 规范：**
```java
/**
 * 管理端文章接口
 */
@RestController
@RequestMapping("/admin/article")
@Slf4j
@RequiredArgsConstructor
public class ArticleController {

    private final IArticleService articleService;

    /**
     * 新增文章
     */
    @PostMapping
    @OperationLog(value = OperationType.INSERT, target = "文章")
    public Result<Void> add(@RequestBody @Valid ArticleDTO articleDTO) {
        log.info("新增文章：{}", articleDTO);
        articleService.add(articleDTO);
        return Result.success();
    }

    /**
     * 分页查询文章
     */
    @GetMapping("/page")
    public Result<PageResult<ArticleVO>> page(ArticlePageQueryDTO queryDTO) {
        log.info("分页查询文章：{}", queryDTO);
        PageResult<ArticleVO> result = articleService.pageQuery(queryDTO);
        return Result.success(result);
    }
}
```

**Service 规范：**
```java
public interface IArticleService {
    void add(ArticleDTO articleDTO);
    PageResult<ArticleVO> pageQuery(ArticlePageQueryDTO queryDTO);
}

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements IArticleService {

    private final ArticleMapper articleMapper;

    @Override
    public void add(ArticleDTO articleDTO) {
        Articles article = new Articles();
        BeanUtils.copyProperties(articleDTO, article);
        articleMapper.insert(article);
    }

    @Override
    public PageResult<ArticleVO> pageQuery(ArticlePageQueryDTO queryDTO) {
        // 实现逻辑
    }
}
```

**自定义注解使用：**

操作日志注解：
```java
@PostMapping
@OperationLog(value = OperationType.INSERT, target = "文章", saveData = true)
public Result<Void> add(@RequestBody ArticleDTO articleDTO) {
    // ...
}
```

限流注解：
```java
@PostMapping("/login")
@RateLimit(type = RateLimit.Type.IP, tokens = 5, burstCapacity = 8, 
           timeWindow = 60, message = "操作过于频繁，请稍后再试")
public Result<AdminLoginVO> login(@RequestBody AdminLoginDTO dto) {
    // ...
}
```

### 前端代码规范

**命名规范：**
- 组件文件：大驼峰（如 `ArticleEdit.vue`）
- 普通文件：小驼峰（如 `request.js`）
- CSS 类名：kebab-case（如 `article-container`）
- 常量：全大写下划线分隔（如 `API_BASE_URL`）

**Vue 组件规范：**
```vue
<template>
  <div class="article-container">
    <el-table :data="articleList" v-loading="loading">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="category" label="分类" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getArticleList } from '@/api/article'

const articleList = ref([])
const loading = ref(false)

onMounted(() => {
  loadArticles()
})

const loadArticles = async () => {
  loading.value = true
  try {
    const { data } = await getArticleList()
    articleList.value = data.records
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.article-container {
  padding: 20px;
}
</style>
```

**API 规范：**
```javascript
import request from '@/utils/request'

export function getArticleList(params) {
  return request({
    url: '/blog/article/list',
    method: 'get',
    params
  })
}

export function getArticleDetail(id) {
  return request({
    url: `/blog/article/${id}`,
    method: 'get'
  })
}

export function createArticle(data) {
  return request({
    url: '/admin/article',
    method: 'post',
    data
  })
}
```

**Pinia Store 规范：**
```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useArticleStore = defineStore('article', () => {
  const articleList = ref([])
  const currentArticle = ref(null)
  const loading = ref(false)

  const fetchArticles = async () => {
    loading.value = true
    try {
      const { data } = await getArticleList()
      articleList.value = data.records
    } finally {
      loading.value = false
    }
  }

  return {
    articleList,
    currentArticle,
    loading,
    fetchArticles
  }
}, {
  persist: true  // 持久化配置
})
```

### 代码风格

**后端：**
- 使用 4 个空格缩进
- 使用 UTF-8 编码
- 使用 Lombok 简化代码（`@Data`、`@Builder`、`@RequiredArgsConstructor` 等）
- 使用 `@Slf4j` 记录日志

**前端：**
- 使用 2 个空格缩进
- 使用 ESLint + Prettier 格式化代码
- 提交前运行 `pnpm lint` 检查代码
- 使用 `<script setup>` 语法

## 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构代码 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具相关 |
| revert | 回滚提交 |

### Scope 范围

| 范围 | 说明 |
|------|------|
| admin | 管理后台相关 |
| blog | 博客相关 |
| home | 主站相关 |
| cv | 简历相关 |
| api | API 接口 |
| db | 数据库相关 |
| deploy | 部署相关 |
| config | 配置相关 |

### 示例

```bash
feat(blog): add article search feature

- Add search input component
- Implement search API with full-text index
- Add search result display with pagination

Closes #123
```

```bash
fix(admin): fix login token expiration issue

The token was expiring immediately due to incorrect time unit conversion.

Fixes #456
```

## Pull Request 流程

### 分支管理

- `main`：主分支，稳定版本
- `develop`：开发分支
- `feature/*`：功能分支
- `fix/*`：修复分支
- `release/*`：发布分支

### 提交前检查

- [ ] 代码符合项目规范
- [ ] 已运行代码检查（后端：Maven 编译通过；前端：`pnpm lint`）
- [ ] 已测试功能正常
- [ ] 提交信息符合规范
- [ ] 已更新相关文档

### PR 标题格式

与提交信息格式相同：
```
<type>(<scope>): <subject>
```

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 变更说明
<!-- 描述本次变更的内容 -->

## 相关 Issue
<!-- 关联的 Issue 编号，如 Closes #123 -->

## 测试说明
<!-- 如何测试这些变更 -->

## 截图
<!-- 如果适用，添加截图 -->

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 已测试功能正常
```

### 审核流程

1. 提交 PR 后，维护者会进行代码审核
2. 根据审核意见修改代码
3. 审核通过后，维护者会合并您的 PR

## 开发建议

### 后端开发建议

1. **使用虚拟线程**
   项目已启用虚拟线程，适合 I/O 密集型操作：
   ```yaml
   spring:
     threads:
       virtual:
         enabled: true
   ```

2. **异步处理**
   使用 `@Async` 注解处理耗时操作：
   ```java
   @Async
   public void sendEmailAsync(String to, String subject, String content) {
       // 异步发送邮件
   }
   ```

3. **缓存使用**
   合理使用 Redis 缓存：
   ```java
   @Cacheable(value = "article", key = "#id")
   public ArticleVO getById(Long id) {
       // 查询逻辑
   }
   ```

4. **日志记录**
   使用 `@Slf4j` 记录日志：
   ```java
   log.info("用户登录：{}", username);
   log.error("系统异常", e);
   ```

5. **异常处理**
   使用自定义异常，统一异常处理：
   ```java
   throw new BaseException("错误信息");
   ```

### 前端开发建议

1. **组合式 API**
   使用 `<script setup>` 语法：
   ```vue
   <script setup>
   import { ref, computed } from 'vue'
   const count = ref(0)
   const doubled = computed(() => count.value * 2)
   </script>
   ```

2. **状态管理**
   使用 Pinia 管理全局状态，支持持久化

3. **组件复用**
   提取公共组件到 `components` 目录

4. **按需加载**
   使用动态导入实现路由懒加载：
   ```javascript
   const routes = [
     {
       path: '/article',
       component: () => import('@/view/Article/index.vue')
     }
   ]
   ```

5. **Element Plus 自动导入**
   项目已配置 Element Plus 组件自动导入，无需手动 import

## 获取帮助

如果您在贡献过程中遇到问题，可以：

1. 查阅项目文档
2. 在 GitHub Issues 中提问
3. 联系项目维护者

---

再次感谢您的贡献！
