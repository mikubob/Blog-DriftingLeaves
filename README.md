# DriftingLeaves

A modern personal blog website system with a decoupled frontend-backend architecture, supporting multi-site deployment.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk)](https://www.oracle.com/java/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**[Live Demo](https://driftingleaves.xyz)** | **[Source Code](https://github.com/mikubob/Blog-DriftingLeaves)** | **[中文文档](README.zh-CN.md)**

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Performance Optimization](#performance-optimization)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Introduction

DriftingLeaves is a fully-featured personal blog system consisting of four sub-sites: Home, Blog, CV, and Admin Dashboard. Built with Spring Boot 3 + Vue 3, it supports Docker containerized deployment.

### Sub-site Overview

| Site | Description | Demo URL |
|------|-------------|----------|
| **Home** | Personal homepage displaying profile and social media links | [driftingleaves.xyz](https://driftingleaves.xyz) |
| **Blog** | Blog system with article publishing, comments, RSS subscriptions, etc. | [blog.driftingleaves.xyz](https://blog.driftingleaves.xyz) |
| **CV** | Online resume showcasing education, work experience, and skills | [cv.driftingleaves.xyz](https://cv.driftingleaves.xyz) |
| **Admin** | Admin dashboard for managing all content and data | [admin.driftingleaves.xyz](https://admin.driftingleaves.xyz) |

## Features

### 📖 Blog (Frontend-Blog)

| Feature | Description |
|---------|-------------|
| **Markdown Rendering** | Using md-editor-v3, consistent with admin editing experience |
| **Categories/Tags** | Multi-dimensional article categorization and tag management |
| **Article Archive** | Timeline display of all articles |
| **Full-text Search** | MySQL full-text index based article search |
| **Comment System** | Nested replies, Markdown support, whisper mode, email notifications |
| **Guestbook** | Independent message system separate from articles |
| **Friend Links** | Display friendly links |
| **Article Likes** | Visitors can like without login |
| **RSS Subscription** | XML Feed + email push for new articles |
| **Auto TOC** | Automatic article table of contents extraction |
| **Dark Mode** | Follow system / manual toggle |
| **Responsive Design** | Perfect mobile adaptation |
| **Visitor Fingerprint** | Comment/like without login |

### 🎛️ Admin Dashboard (Frontend-Admin)

| Feature | Description |
|---------|-------------|
| **Article Management** | Markdown editor, cover upload, category/tag management |
| **Comment/Message Review** | Approve/reject, reply management |
| **Friend Links Management** | CRUD operations for friendly links |
| **Music Management** | Background music upload and management |
| **Profile Management** | Nickname, avatar, bio, etc. |
| **Social Media Management** | GitHub, email, and other links |
| **Visitor Statistics** | ECharts data visualization dashboard |
| **System Configuration** | Site settings, ICP info, etc. |
| **Operation Logs** | Record all admin operations |

### 🏠 Personal Homepage (Frontend-Home)

| Feature | Description |
|---------|-------------|
| **Profile Display** | Nickname, tags, bio, avatar |
| **Social Media Links** | GitHub, email, personal website, etc. |
| **Clean Design** | Elegant single-page design style |
| **Visitor Statistics** | Visitor identification and counting |
| **Responsive Layout** | Adapt to various screen sizes |

### 📄 Online Resume (Frontend-Cv)

| Feature | Description |
|---------|-------------|
| **Education** | School, major, time period display |
| **Work Experience** | Company, position, job description display |
| **Project Experience** | Project name, tech stack, achievements display |
| **Skill Tags** | Skill name and proficiency display |
| **Responsive Layout** | Perfect mobile adaptation for easy sharing |
| **Print-friendly** | Support printing to PDF resume |

## Tech Stack

### Backend

| Technology | Version | Description |
|------------|---------|-------------|
| Java | 21 | JDK version (supports virtual threads) |
| Spring Boot | 3.x | Base framework |
| MyBatis-Plus | - | ORM framework |
| MySQL | 8.0+ | Relational database |
| Redis | - | Cache database |
| Druid | - | Alibaba database connection pool |
| JJWT | - | JWT Token generation and parsing |
| Hutool | - | Java utility library |
| FastJSON2 | - | JSON processing |
| CommonMark | - | Markdown parsing (with table, task list extensions) |
| Jsoup | - | HTML sanitization (XSS protection) |
| Aliyun OSS | - | Object storage |
| Spring Mail | - | Email service |
| ip2region | - | IP address parsing (offline database) |
| Thumbnailator | - | Image compression processing |
| WebP ImageIO | - | WebP format support |
| Lombok | - | Simplify Java code |
| Jakarta Validation | - | Parameter validation |

### Frontend

| Technology | Version | Description |
|------------|---------|-------------|
| Vue | 3.5.x | Progressive JavaScript framework |
| Vite | 7.x | Next-generation frontend build tool |
| Vue Router | 4.x | Routing management |
| Pinia | 3.x | State management |
| pinia-plugin-persistedstate | 4.x | Pinia state persistence |
| Element Plus | 2.x | UI component library |
| @element-plus/icons-vue | 2.x | Element Plus icon library |
| Axios | 1.x | HTTP client |
| ECharts | 5.x | Data visualization (Admin only) |
| md-editor-v3 | 6.x | Markdown editor (Admin, Blog) |
| dayjs | 1.x | Date processing (Admin only) |
| Sass | 1.x | CSS preprocessor |
| unplugin-icons | - | Icon auto-import |
| unplugin-auto-import | - | API auto-import |
| unplugin-vue-components | - | Component auto-import |
| ESLint + Prettier | - | Code standards and formatting |
| Husky + lint-staged | - | Git commit hooks |

### Deployment

| Technology | Description |
|------------|-------------|
| Docker | Containerized deployment |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy and static resource service |
| aaPanel | Server management (optional) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy (SSL)                            │
│      blog.driftingleaves.xyz    home.driftingleaves.xyz                 │
│        cv.driftingleaves.xyz    admin.driftingleaves.xyz                │
└────────┬──────────────┬──────────────┬──────────────┬──────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Frontend │   │ Frontend │   │ Frontend │   │ Frontend │
   │   Blog   │   │   Home   │   │    CV    │   │  Admin   │
   │ Vue 3 +  │   │ Vue 3 +  │   │ Vue 3 +  │   │ Vue 3 +  │
   │  Vite    │   │  Vite    │   │  Vite    │   │  Vite    │
   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                              │
                              │  /api
                              ▼
                   ┌────────────────────┐
                   │    Spring Boot 3   │
                   │      Backend       │
                   │    Port: 5922      │
                   │  (Java 21 Virtual  │
                   │      Threads)      │
                   └─────────┬──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │  MySQL   │  │  Redis   │  │  Aliyun OSS  │
        │    8     │  │    7     │  │  Image/File  │
        └──────────┘  └──────────┘  └──────────────┘
```

### Architecture Notes

- **Nginx**: Acts as reverse proxy, handling SSL certificates, static resource service, and API forwarding
- **Frontend Apps**: Four independent Vue 3 applications, corresponding to different subdomains
- **Backend Service**: Spring Boot 3 monolithic application with Java 21 virtual threads enabled
- **MySQL**: Stores all business data
- **Redis**: Caches hot data, stores sessions, rate limiting counters
- **Aliyun OSS**: Stores images, music, and other static resources

## Project Structure

```
DriftingLeaves-Website/
├── Backend/                          # Backend project
│   ├── DL-common/                   # Common module
│   │   └── src/main/java/com/xuan/
│   │       ├── constant/            # Constants
│   │       ├── context/             # Context (e.g., user context)
│   │       ├── enumeration/         # Enums
│   │       ├── exception/           # Custom exceptions
│   │       ├── json/                # JSON configuration
│   │       ├── properties/          # Configuration properties
│   │       ├── result/              # Unified return results
│   │       └── utils/               # Utility classes
│   ├── DL-pojo/                     # Entity module
│   │   └── src/main/java/com/xuan/
│   │       ├── dto/                 # Data transfer objects
│   │       ├── entity/              # Database entities
│   │       └── vo/                  # View objects
│   └── DL-server/                   # Service module
│       └── src/main/
│           ├── java/com/xuan/
│           │   ├── annotation/      # Custom annotations
│           │   ├── aspect/          # AOP aspects
│           │   ├── config/          # Configuration classes
│           │   ├── controller/      # Controllers
│           │   │   ├── admin/       # Admin APIs
│           │   │   ├── blog/        # Blog APIs
│           │   │   ├── cv/          # CV APIs
│           │   │   ├── health/      # Health check
│           │   │   └── home/        # Home APIs
│           │   ├── handle/          # Handlers
│           │   ├── interceptor/     # Interceptors
│           │   ├── mapper/          # MyBatis Mappers
│           │   ├── service/         # Service layer
│           │   ├── task/            # Scheduled tasks
│           │   └── websocket/       # WebSocket
│           └── resources/
│               ├── lua/             # Lua scripts
│               ├── mapper/          # Mapper XML
│               ├── sql/             # Database scripts
│               └── application.yml.template  # Config template
├── Frontend-Admin/                  # Admin dashboard frontend
├── Frontend-Blog/                   # Blog frontend
├── Frontend-Home/                   # Home frontend
├── Frontend-Cv/                     # CV frontend
├── DockerForDriftingLeaves/         # Docker deployment config
│   ├── docker-compose.yml           # Docker Compose config
│   ├── Dockerfile                   # Backend image build file
│   ├── nginx/                       # Nginx config
│   │   └── nginx.conf
│   └── Deploy.md                    # Deployment docs
├── README.md
└── CONTRIBUTING.md
```

## Quick Start

### Requirements

#### Backend
- JDK 21+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+

#### Frontend
- Node.js 20.19.0+ or 22.12.0+
- pnpm (recommended) or npm

### Backend Startup

1. **Clone the project**
   ```bash
   git clone https://github.com/mikubob/Blog-DriftingLeaves.git
   cd Blog-DriftingLeaves
   ```

2. **Create database**
   ```sql
   CREATE DATABASE driftingleaves CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Execute database scripts**
   Execute SQL statements in `Backend/DL-server/src/main/resources/sql/sql.sql`

4. **Generate admin password**
   The project uses salted encryption for password storage. Run the test class to generate an encrypted password:
   ```java
   // Generate password in test class
   String password = "your-password";
   String salt = "your-salt";
   String encryptedPassword = EncryptPasswordService.encrypt(password, salt);
   System.out.println("Encrypted password: " + encryptedPassword);
   ```

5. **Configure application**
   ```bash
   cd Backend/DL-server/src/main/resources
   cp application.yml.template application.yml
   cp application-dev.yml.template application-dev.yml
   ```

6. **Start backend**
   ```bash
   cd Backend
   mvn clean install -DskipTests
   java -jar DL-server/target/DriftingLeaves.jar
   ```
   
   Backend service will start on port `5922`.

### Frontend Startup

1. **Install dependencies**
   ```bash
   cd Frontend-Admin  # or Frontend-Blog, Frontend-Home, Frontend-Cv
   pnpm install
   ```

2. **Start dev server**
   ```bash
   pnpm dev
   ```

3. **Build for production**
   ```bash
   pnpm build
   ```

## Configuration

### Backend Configuration

| Config Item | Description | Required |
|-------------|-------------|----------|
| `spring.datasource.*` | MySQL database connection info | ✅ |
| `spring.data.redis.*` | Redis connection info | ✅ |
| `dl.jwt.secret-key` | JWT secret (recommended 32+ random chars) | ✅ |
| `dl.jwt.ttl` | JWT expiration time (milliseconds) | ✅ |
| `dl.alioss.*` | Aliyun OSS configuration | ✅ |
| `spring.mail.*` | Email SMTP configuration | ✅ |
| `dl.email.personal` | Email sender nickname | ✅ |
| `dl.email.from` | Email sender address | ✅ |
| `dl.visitor.verify-code` | Visitor login verification code | ❌ |
| `dl.image.compress.*` | Image compression configuration | ❌ |
| `dl.website.*` | Website info configuration | ✅ |

### Frontend Configuration

Frontend dev server proxies to `http://localhost:5922` by default, can be modified in `vite.config.js`:

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

## Docker Deployment

For detailed deployment instructions, see [DockerForDriftingLeaves/Deploy.md](DockerForDriftingLeaves/Deploy.md).

### Quick Deployment

1. **Prepare files**
   ```bash
   # Frontend build
   cd Frontend-Admin && pnpm build
   cp -r dist ../DockerForDriftingLeaves/html/Admin/
   
   # Backend build
   cd Backend && mvn clean package -DskipTests
   cp DL-server/target/DriftingLeaves.jar ../DockerForDriftingLeaves/backend/
   ```

2. **Configure SSL certificates**
   Place domain certificates in `DockerForDriftingLeaves/SSL/` corresponding directories

3. **Create network and start**
   ```bash
   docker network create driftingleaves
   cd DockerForDriftingLeaves
   docker-compose up -d
   ```

### Domain Configuration

| Domain | Purpose | Nginx Config |
|--------|---------|--------------|
| driftingleaves.xyz | Home | html/Home/dist |
| admin.driftingleaves.xyz | Admin | html/Admin/dist |
| blog.driftingleaves.xyz | Blog | html/Blog/dist |
| cv.driftingleaves.xyz | CV | html/CV/dist |

## API Documentation

### API Endpoints

| Endpoint | Description | Auth |
|----------|-------------|------|
| `/admin/**` | Admin APIs | JWT Token |
| `/blog/**` | Blog public APIs | None |
| `/home/**` | Home public APIs | None |
| `/cv/**` | CV public APIs | None |
| `/health` | Health check | None |

### Main API Examples

```bash
# Get article list
GET /blog/article/list?page=1&size=10

# Get article detail
GET /blog/article/{slug}

# Get RSS feed
GET /blog/rss

# Get Sitemap
GET /blog/sitemap.xml

# Admin login
POST /admin/admin/login
Content-Type: application/json
{
  "username": "admin",
  "password": "password",
  "code": "verify-code"
}
```

## Security Features

- **Authentication**: JWT Token authentication mechanism
- **Password Encryption**: Salted hash encryption storage
- **Rate Limiting**: Token bucket algorithm based API rate limiting
- **XSS Protection**: Markdown content XSS filtering
- **CORS Configuration**: Cross-origin request security configuration
- **SQL Injection Protection**: MyBatis-Plus parameterized queries

### Rate Limiting Annotation Usage

```java
@PostMapping("/login")
@RateLimit(type = RateLimit.Type.IP, tokens = 5, burstCapacity = 8, 
           timeWindow = 60, message = "Too many requests, please try again later")
public Result<AdminLoginVO> login(@RequestBody AdminLoginDTO dto) {
    // ...
}
```

## Performance Optimization

### Backend Optimization
- **Virtual Threads**: Enable Java 21 virtual threads for improved I/O-intensive operations
- **Async Processing**: Email sending, logging, etc. executed asynchronously
- **Redis Caching**: Hot data caching to reduce database pressure
- **Connection Pool**: Druid connection pool for database connection optimization
- **Scheduled Sync**: Like counts, view counts synced to database periodically

### Frontend Optimization
- **Code Splitting**: Module-based bundling to reduce initial load time
- **Component Lazy Loading**: Route-level code splitting
- **Resource Compression**: Terser compression, remove console and debugger
- **CDN Caching**: 30-day cache for static resources
- **Gzip Compression**: Nginx Gzip compression enabled

## FAQ

### Q: Backend startup fails with database connection error?
A: Check if MySQL service is running, database is created, and connection info in config files is correct.

### Q: Frontend dev server cannot access backend API?
A: Ensure backend service is running on port 5922, check proxy configuration in vite.config.js.

### Q: How to generate admin password?
A: The project uses salted encryption. Generate password in test class using the encryption method, then insert into database.

### Q: Image upload fails?
A: Check if Aliyun OSS configuration is correct, Bucket exists, and has write permissions.

### Q: Email sending fails?
A: Check email SMTP configuration, ensure you're using email authorization code instead of login password.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for how to participate in project development.

## License

This project is licensed under the MIT License.
