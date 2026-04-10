# DriftingLeaves 项目 Docker 部署文档

## 项目架构概述

本项目采用前后端分离架构，使用 Docker Compose 进行容器化部署：

- **前端**: 多个 Vue/React 项目（Home、Admin、Blog、CV），使用 pnpm build 打包为 dist 文件夹
- **后端**: Spring Boot 项目，使用 Maven 打包为 JAR 文件
- **反向代理**: Nginx 处理静态资源和 API 转发
- **SSL**: 各子域名独立配置 HTTPS 证书
- **宝塔面板**: 通过反向代理实现域名访问（防止使用端口访问）

---

## 目录结构

```
DockerForDriftingLeaves/
├── docker-compose.yml          # Docker Compose 配置文件
├── Dockerfile                  # 后端服务镜像构建文件
├── Deploy.md                   # 本部署文档
├── nginx/
│   └── nginx.conf              # Nginx 配置文件
├── html/                       # 前端静态资源目录
│   ├── Home/dist/              # 主站前端打包文件
│   ├── Admin/dist/             # 管理后台前端打包文件
│   ├── Blog/dist/              # 博客前端打包文件
│   └── CV/dist/                # 简历前端打包文件
├── backend/
│   └── DriftingLeaves.jar      # 后端 Spring Boot JAR 包
└── SSL/                        # SSL 证书目录
    ├── SSL-Home/               # 主站证书 (driftingleaves.xyz)
    ├── SSL-Admin/              # 管理后台证书 (admin.driftingleaves.xyz)
    ├── SSL-Blog/               # 博客证书 (blog.driftingleaves.xyz)
    ├── SSL-Cv/                 # 简历证书 (cv.driftingleaves.xyz)
    └── SSL-Bt/                 # 宝塔面板证书 (bt.driftingleaves.xyz)
        └── bt.driftingleaves.xyz_nginx/
            ├── bt.driftingleaves.xyz_bundle.pem
            └── bt.driftingleaves.xyz.key
```

---

## 域名配置

| 域名 | 用途 | 对应目录 |
|------|------|----------|
| driftingleaves.xyz / www.driftingleaves.xyz | 主站 | html/Home/dist |
| admin.driftingleaves.xyz | 管理后台 | html/Admin/dist |
| blog.driftingleaves.xyz | 博客 | html/Blog/dist |
| cv.driftingleaves.xyz | 简历 | html/CV/dist |
| bt.driftingleaves.xyz | 宝塔面板代理 | 反向代理到宝塔 |

---

## 前置准备

### 1. 服务器环境要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+/CentOS 7+)
- **CPU**: 2 核+
- **内存**: 4GB+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 2. 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 3. 域名解析配置

在域名服务商处添加以下 DNS 解析记录（A 记录指向服务器 IP）：

```
@               A       你的服务器IP
www             A       你的服务器IP
admin           A       你的服务器IP
blog            A       你的服务器IP
cv              A       你的服务器IP
bt              A       你的服务器IP
```

---

## 部署步骤

### 第一步：准备项目文件

#### 1.1 前端打包

在每个前端项目目录下执行：

```bash
# 进入前端项目目录
cd /path/to/Home    # 或 Admin、Blog、CV

# 安装依赖并打包
pnpm install
pnpm build

# 将 dist 文件夹复制到部署目录
cp -r dist /path/to/DockerForDriftingLeaves/html/Home/
```

#### 1.2 后端打包

在 Spring Boot 项目目录下执行：

```bash
# Maven 打包
mvn clean package -DskipTests

# 将 JAR 包复制到部署目录
cp target/DriftingLeaves.jar /path/to/DockerForDriftingLeaves/backend/
```

#### 1.3 SSL 证书准备

将各域名的 SSL 证书文件放入对应目录：

```bash
SSL/
├── SSL-Home/
│   ├── driftingleaves.xyz.csr              # 证书签名请求文件
│   ├── driftingleaves.xyz.key              # 私钥文件
│   ├── driftingleaves.xyz_bundle           # 证书文件
│   └── driftingleaves.xyz_bundle.pem       # PEM 格式证书文件
├── SSL-Admin/
│   ├── admin.driftingleaves.xyz.csr        # 证书签名请求文件
│   ├── admin.driftingleaves.xyz.key        # 私钥文件
│   ├── admin.driftingleaves.xyz_bundle     # 证书文件
│   └── admin.driftingleaves.xyz_bundle.pem # PEM 格式证书文件
├── SSL-Blog/
│   ├── blog.driftingleaves.xyz.csr
│   ├── blog.driftingleaves.xyz.key
│   ├── blog.driftingleaves.xyz_bundle
│   └── blog.driftingleaves.xyz_bundle.pem
├── SSL-Cv/
│   ├── cv.driftingleaves.xyz.csr
│   ├── cv.driftingleaves.xyz.key
│   ├── cv.driftingleaves.xyz_bundle
│   └── cv.driftingleaves.xyz_bundle.pem
└── SSL-Bt/
    └── bt.driftingleaves.xyz_nginx/
        ├── bt.driftingleaves.xyz.csr       # 证书签名请求文件
        ├── bt.driftingleaves.xyz.key       # 私钥文件
        ├── bt.driftingleaves.xyz_bundle    # 证书文件
        └── bt.driftingleaves.xyz_bundle.pem # PEM 格式证书文件
```

### 第二步：配置宝塔面板反向代理

#### 2.1 修改 nginx.conf 中的宝塔代理配置

编辑 `nginx/nginx.conf`，修改宝塔面板 server 块中的代理地址：

```nginx
# 找到以下部分并修改
server {
    listen 443 ssl http2;
    server_name bt.driftingleaves.xyz;

    ssl_certificate /etc/nginx/ssl/SSL-Bt/bt.driftingleaves.xyz_nginx/bt.driftingleaves.xyz_bundle.pem;
    ssl_certificate_key /etc/nginx/ssl/SSL-Bt/bt.driftingleaves.xyz_nginx/bt.driftingleaves.xyz.key;
    # ... SSL 配置 ...

    location / {
        # 修改为你的服务器 IP 和宝塔面板端口
        # 例如：proxy_pass https://127.0.0.1:95565298/;
        proxy_pass https://${你的服务器IP}:${宝塔安全入口端口}/;
        proxy_http_version 1.1;
        proxy_set_header Host ${你的服务器IP}:${宝塔安全入口端口};
        # ... 其他配置 ...
    }
}
```

**示例配置**（假设宝塔面板安全入口为 `123456`）：

```nginx
location / {
    proxy_pass https://127.0.0.1:123456/;
    proxy_http_version 1.1;
    proxy_set_header Host 127.0.0.1:123456;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_ssl_verify off;
    proxy_ssl_server_name on;

    proxy_redirect ~^https?://[^/]+(/.+)$ $scheme://$host$1;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

#### 2.2 宝塔面板配置注意事项

1. **安全入口**: 宝塔面板默认使用随机安全入口（如 `https://bt.driftingleaves.xyz/123456`）
2. **端口放行**: 确保宝塔面板端口在服务器防火墙中放行
3. **访问方式**: 配置完成后，通过 `https://bt.driftingleaves.xyz` 即可访问宝塔面板，无需输入端口号

### 第三步：创建 Docker 网络

```bash
# 创建自定义网络（与 docker-compose.yml 中配置一致）
docker network create driftingleaves
```

### 第四步：启动服务

```bash
# 进入项目目录
cd /path/to/DockerForDriftingLeaves

# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f nginx
```

### 第五步：验证部署

```bash
# 检查容器运行状态
docker ps

# 测试后端健康检查
curl http://localhost:5922/health

# 测试 Nginx
curl http://localhost

# 查看日志确认无错误
docker-compose logs --tail=100
```

---

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart nginx

# 重新构建并启动
docker-compose up -d --build
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f nginx
```

### 更新部署

```bash
# 1. 拉取最新代码/更新文件
# ...

# 2. 重新构建后端镜像
docker-compose build backend

# 3. 重启服务
docker-compose up -d

# 4. 清理旧镜像
docker image prune -f
```

---

## 资源限制说明

根据服务器配置（2核4G），当前配置如下：

| 服务 | CPU 限制 | 内存限制 | 说明 |
|------|----------|----------|------|
| backend | 1.0 核 | 1536MB | Java 应用，预留 512MB |
| nginx | 0.5 核 | 256MB | 静态资源服务 |

**可根据服务器配置调整**:

- 编辑 `docker-compose.yml` 中的 `deploy.resources` 部分
- 编辑 `Dockerfile` 中的 `JAVA_OPTS` 环境变量

---

## 故障排查

### 1. 容器无法启动

```bash
# 查看详细错误信息
docker-compose logs

# 检查配置文件语法
docker-compose config

# 检查端口占用
sudo netstat -tlnp | grep -E '80|443|5922'
```

### 2. SSL 证书错误

```bash
# 检查证书文件是否存在
ls -la SSL/

# 检查证书权限
chmod 644 SSL/*/*.pem
chmod 600 SSL/*/*.key

# 验证证书内容
openssl x509 -in SSL/SSL-Home/driftingleaves.xyz_bundle.pem -text -noout
```

### 3. 后端服务无法访问

```bash
# 检查后端容器状态
docker ps | grep backend

# 进入后端容器检查
docker exec -it driftingleaves-backend sh

# 测试后端端口
curl http://localhost:5922/actuator/health
```

### 4. 宝塔面板无法访问

```bash
# 检查宝塔面板是否正常运行
systemctl status bt

# 检查宝塔面板端口
bt default

# 检查 Nginx 代理配置
docker exec driftingleaves-nginx nginx -t
```

---

## 安全建议

1. **定期更新**: 定期更新 Docker 镜像和系统补丁
2. **防火墙配置**: 仅开放必要端口（80、443）
3. **日志监控**: 配置日志轮转，防止磁盘占满
4. **备份策略**: 定期备份 SSL 证书和数据库
5. **访问控制**: 宝塔面板使用强密码，并限制 IP 访问

---

## 附录

### 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| TZ | Asia/Shanghai | 时区设置 |
| JAVA_OPTS | -Xms512m -Xmx1024m | JVM 参数 |

### 端口映射

| 容器端口 | 宿主机端口 | 用途 |
|----------|------------|------|
| 80 | 80 | HTTP |
| 443 | 443 | HTTPS |
| 5922 | 5922 | 后端 API |

### 健康检查端点

- 后端: `http://localhost:5922/health`
- Nginx: `http://localhost/`
