# Contributing Guide

Thank you for your interest in contributing to the DriftingLeaves project! This document will help you understand how to participate in project development.

**Project URL**: [https://github.com/mikubob/Blog-DriftingLeaves](https://github.com/mikubob/Blog-DriftingLeaves)

**Live Demo**: [https://driftingleaves.xyz](https://driftingleaves.xyz)

**[中文文档](CONTRIBUTING.zh-CN.md)**

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Project Standards](#project-standards)
- [Commit Standards](#commit-standards)
- [Pull Request Process](#pull-request-process)
- [Development Tips](#development-tips)
- [Getting Help](#getting-help)

## Code of Conduct

- Respect all contributors
- Accept constructive criticism
- Focus on what's best for the project
- Be friendly and inclusive to the community

## How to Contribute

### Reporting Bugs

If you find a bug, please submit it via GitHub Issues with the following information:

1. **Bug Description**: Clear and concise description of the problem
2. **Reproduction Steps**: Detailed steps to reproduce
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment Info**:
   - Operating System
   - Java Version
   - Node.js Version
   - Browser Version (if it's a frontend issue)
6. **Screenshots**: Add screenshots if applicable to help explain the problem
7. **Logs**: Relevant error logs

### Proposing New Features

If you have an idea for a new feature, please submit it via GitHub Issues:

1. **Feature Description**: Clearly describe the feature you'd like to add
2. **Use Case**: Describe the use case for this feature
3. **Implementation Suggestions**: Share your implementation ideas if you have any
4. **Alternatives**: Are there other viable implementation approaches?

### Submitting Code

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Submit a Pull Request

## Development Environment Setup

### Backend Development Environment

**Requirements:**
- JDK 21+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- IDE (IntelliJ IDEA recommended)

**Setup Steps:**

1. Clone the project
   ```bash
   git clone https://github.com/mikubob/Blog-DriftingLeaves.git
   cd Blog-DriftingLeaves/Backend
   ```

2. Create database and execute SQL scripts
   ```sql
   CREATE DATABASE driftingleaves CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE driftingleaves;
   -- Execute DL-server/src/main/resources/sql/sql.sql
   ```

3. Configure application
   ```bash
   cd DL-server/src/main/resources
   cp application.yml.template application.yml
   cp application-dev.yml.template application-dev.yml
   # Edit configuration files with necessary settings
   ```

4. Open project in IDE
   - Open `Backend` directory with IntelliJ IDEA
   - Wait for Maven to automatically download dependencies
   - Run `DriftingLeavesApplication.java`

### Frontend Development Environment

**Requirements:**
- Node.js 20.19.0+ or 22.12.0+
- pnpm (recommended)

**Setup Steps:**

1. Install pnpm (if not installed)
   ```bash
   npm install -g pnpm
   ```

2. Navigate to frontend project directory
   ```bash
   cd Frontend-Admin  # or Frontend-Blog, Frontend-Home, Frontend-Cv
   ```

3. Install dependencies
   ```bash
   pnpm install
   ```

4. Start dev server
   ```bash
   pnpm dev
   ```

## Project Architecture

### Backend Architecture

The project uses a layered architecture with three modules:

```
Backend/
├── DL-common/           # Common module
│   ├── constant/        # Constants
│   ├── context/         # Context (e.g., user context)
│   ├── enumeration/     # Enums
│   ├── exception/       # Custom exceptions
│   ├── json/            # JSON configuration
│   ├── properties/      # Configuration properties
│   ├── result/          # Unified return results
│   └── utils/           # Utility classes
├── DL-pojo/             # Entity module
│   ├── dto/             # Data transfer objects
│   ├── entity/          # Database entities
│   └── vo/              # View objects
└── DL-server/           # Service module
    ├── annotation/      # Custom annotations
    ├── aspect/          # AOP aspects
    ├── config/          # Configuration classes
    ├── controller/      # Controllers
    ├── handle/          # Handlers (global exception, metadata filling)
    ├── interceptor/     # Interceptors
    ├── mapper/          # MyBatis Mappers
    ├── service/         # Service layer
    ├── task/            # Scheduled tasks
    └── websocket/       # WebSocket
```

### Database Schema

| Table Name | Description |
|------------|-------------|
| `admin` | Admin table |
| `operation_logs` | Operation logs table |
| `system_config` | System configuration table |
| `personal_info` | Personal info table |
| `social_media` | Social media table |
| `experiences` | Experience table (education, work, projects) |
| `skills` | Skills table |
| `visitors` | Visitors table |
| `views` | View records table |
| `articles` | Articles table |
| `article_categories` | Article categories table |
| `article_tags` | Article tags table |
| `article_tag_relations` | Article tag relations table |
| `article_comments` | Article comments table |
| `article_likes` | Article likes table |
| `rss_subscriptions` | RSS subscriptions table |
| `friend_links` | Friend links table |
| `messages` | Messages table |
| `music` | Music table |

### Frontend Architecture

Each frontend project uses a similar architecture:

```
Frontend-xxx/
├── public/              # Static resources
│   ├── favicon.ico      # Site icon
│   └── robots.txt       # Crawler config (Blog)
├── src/
│   ├── api/             # API interface encapsulation
│   ├── assets/          # Resource files
│   │   ├── emjio/       # Emojis (Admin, Blog)
│   │   ├── font/        # Font files
│   │   ├── icon/        # Icon files
│   │   └── styles/      # Style files
│   ├── components/      # Common components
│   ├── composables/     # Composable functions
│   ├── router/          # Router configuration
│   ├── stores/          # Pinia state management
│   │   └── modules/     # State modules
│   ├── utils/           # Utility functions
│   ├── view/            # Page components
│   ├── App.vue          # Root component
│   └── main.js          # Entry file
├── index.html           # HTML template
├── package.json         # Project configuration
├── vite.config.js       # Vite configuration
└── jsconfig.json        # JS configuration
```

## Project Standards

### Backend Code Standards

**Naming Conventions:**
- Class names: PascalCase (e.g., `ArticleService`)
- Method names: camelCase (e.g., `getArticleById`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_PAGE_SIZE`)
- Package names: lowercase (e.g., `com.xuan.service`)
- Interfaces start with `I` (e.g., `IArticleService`)
- Implementation classes end with `Impl` (e.g., `ArticleServiceImpl`)

**Comment Standards:**
- Classes and interfaces must have Javadoc comments
- Public methods must have Javadoc comments
- Complex logic must have inline comments

**Controller Standards:**
```java
/**
 * Admin article interface
 */
@RestController
@RequestMapping("/admin/article")
@Slf4j
@RequiredArgsConstructor
public class ArticleController {

    private final IArticleService articleService;

    /**
     * Add article
     */
    @PostMapping
    @OperationLog(value = OperationType.INSERT, target = "Article")
    public Result<Void> add(@RequestBody @Valid ArticleDTO articleDTO) {
        log.info("Add article: {}", articleDTO);
        articleService.add(articleDTO);
        return Result.success();
    }

    /**
     * Page query articles
     */
    @GetMapping("/page")
    public Result<PageResult<ArticleVO>> page(ArticlePageQueryDTO queryDTO) {
        log.info("Page query articles: {}", queryDTO);
        PageResult<ArticleVO> result = articleService.pageQuery(queryDTO);
        return Result.success(result);
    }
}
```

**Service Standards:**
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
        // Implementation logic
    }
}
```

**Custom Annotation Usage:**

Operation log annotation:
```java
@PostMapping
@OperationLog(value = OperationType.INSERT, target = "Article", saveData = true)
public Result<Void> add(@RequestBody ArticleDTO articleDTO) {
    // ...
}
```

Rate limiting annotation:
```java
@PostMapping("/login")
@RateLimit(type = RateLimit.Type.IP, tokens = 5, burstCapacity = 8, 
           timeWindow = 60, message = "Too many requests, please try again later")
public Result<AdminLoginVO> login(@RequestBody AdminLoginDTO dto) {
    // ...
}
```

### Frontend Code Standards

**Naming Conventions:**
- Component files: PascalCase (e.g., `ArticleEdit.vue`)
- Regular files: camelCase (e.g., `request.js`)
- CSS class names: kebab-case (e.g., `article-container`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

**Vue Component Standards:**
```vue
<template>
  <div class="article-container">
    <el-table :data="articleList" v-loading="loading">
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="category" label="Category" />
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

**API Standards:**
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

**Pinia Store Standards:**
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
  persist: true  // Persistence configuration
})
```

### Code Style

**Backend:**
- Use 4 spaces for indentation
- Use UTF-8 encoding
- Use Lombok to simplify code (`@Data`, `@Builder`, `@RequiredArgsConstructor`, etc.)
- Use `@Slf4j` for logging

**Frontend:**
- Use 2 spaces for indentation
- Use ESLint + Prettier for code formatting
- Run `pnpm lint` before committing
- Use `<script setup>` syntax

## Commit Standards

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation update |
| style | Code style (no functional change) |
| refactor | Code refactoring |
| perf | Performance optimization |
| test | Test related |
| chore | Build/tool related |
| revert | Revert commit |

### Scope

| Scope | Description |
|-------|-------------|
| admin | Admin dashboard related |
| blog | Blog related |
| home | Home site related |
| cv | CV related |
| api | API interface |
| db | Database related |
| deploy | Deployment related |
| config | Configuration related |

### Examples

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

## Pull Request Process

### Branch Management

- `main`: Main branch, stable version
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Fix branches
- `release/*`: Release branches

### Pre-submission Checklist

- [ ] Code follows project standards
- [ ] Code checks passed (Backend: Maven compilation; Frontend: `pnpm lint`)
- [ ] Functionality tested and working
- [ ] Commit message follows standards
- [ ] Related documentation updated

### PR Title Format

Same format as commit message:
```
<type>(<scope>): <subject>
```

### PR Description Template

```markdown
## Change Type
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update
- [ ] Other

## Change Description
<!-- Describe what this change does -->

## Related Issue
<!-- Related Issue number, e.g., Closes #123 -->

## Testing Instructions
<!-- How to test these changes -->

## Screenshots
<!-- Add screenshots if applicable -->

## Checklist
- [ ] Code follows project standards
- [ ] Necessary comments added
- [ ] Related documentation updated
- [ ] Functionality tested and working
```

### Review Process

1. After submitting PR, maintainers will review the code
2. Modify code according to review comments
3. After approval, maintainers will merge your PR

## Development Tips

### Backend Development Tips

1. **Use Virtual Threads**
   The project has virtual threads enabled, suitable for I/O-intensive operations:
   ```yaml
   spring:
     threads:
       virtual:
         enabled: true
   ```

2. **Async Processing**
   Use `@Async` annotation for time-consuming operations:
   ```java
   @Async
   public void sendEmailAsync(String to, String subject, String content) {
       // Send email asynchronously
   }
   ```

3. **Cache Usage**
   Use Redis cache appropriately:
   ```java
   @Cacheable(value = "article", key = "#id")
   public ArticleVO getById(Long id) {
       // Query logic
   }
   ```

4. **Logging**
   Use `@Slf4j` for logging:
   ```java
   log.info("User login: {}", username);
   log.error("System exception", e);
   ```

5. **Exception Handling**
   Use custom exceptions with unified exception handling:
   ```java
   throw new BaseException("Error message");
   ```

### Frontend Development Tips

1. **Composition API**
   Use `<script setup>` syntax:
   ```vue
   <script setup>
   import { ref, computed } from 'vue'
   const count = ref(0)
   const doubled = computed(() => count.value * 2)
   </script>
   ```

2. **State Management**
   Use Pinia for global state management with persistence support

3. **Component Reuse**
   Extract common components to `components` directory

4. **Lazy Loading**
   Use dynamic imports for route lazy loading:
   ```javascript
   const routes = [
     {
       path: '/article',
       component: () => import('@/view/Article/index.vue')
     }
   ]
   ```

5. **Element Plus Auto-import**
   The project has Element Plus component auto-import configured, no manual import needed

## Getting Help

If you encounter problems during contribution, you can:

1. Check project documentation
2. Ask questions in GitHub Issues
3. Contact project maintainers

---

Thank you again for your contribution!
