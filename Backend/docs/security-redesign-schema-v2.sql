-- ============================================================
-- DriftingLeaves 基于 Spring Security 的安全架构数据库设计 V2
-- ============================================================
-- 说明：
-- 1. 本 SQL 是基于新的 Spring Security + JWT + Redis 白名单体系重新设计的完整库结构
-- 2. 删除了原有的 admin 表，将其合并到统一的 sys_user 用户体系中
-- 3. 增加了 RBAC 权限模型表（sys_role、sys_user_role、sys_permission、sys_role_permission）
-- 4. 核心设计原则：彻底取消匿名用户的交互权限
--    - 评论、点赞、留言、订阅等业务操作必须登录后才能执行
--    - 未登录用户只能浏览公开内容
--    - 前端在相关操作时统一引导登录
-- 5. visitors 表仅用于访问统计（PV/UV），不再与任何业务操作关联
-- 6. 所有交互表只保留 user_id，删除 visitor_id、nickname、email_or_qq 等匿名字段
-- 7. 所有主键统一使用 BIGINT，便于后续分布式扩展
-- 8. 时间字段统一使用 DEFAULT CURRENT_TIMESTAMP 和 ON UPDATE CURRENT_TIMESTAMP
-- ============================================================

-- 先清理旧表（按需执行，生产环境请谨慎）
-- DROP TABLE IF EXISTS admin;

-- ============================================================
-- 一、核心用户与权限体系（新增 + 替换 admin 表）
-- ============================================================

-- 【新增】系统用户表：替代原 admin 表，统一存储管理员、后台游客、博客用户
-- 【删除】原 admin 表数据需迁移至此表
-- 设计说明：
-- 1. 不再区分 admin 和普通用户表，所有登录用户都在此表
-- 2. user_type 字段区分用户类型：1博客用户 2管理员 3后台游客
-- 3. login_type 字段区分登录方式：1本地账号密码 2GitHub 3Gitee
-- 4. 第三方登录时 password 字段可为空，通过 oauth_id + oauth_provider 绑定
CREATE TABLE sys_user (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username        VARCHAR(64)  NOT NULL UNIQUE COMMENT '用户名/登录账号',
    password        VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    nickname        VARCHAR(64)  NOT NULL COMMENT '昵称',
    email           VARCHAR(128)          COMMENT '邮箱',
    avatar          VARCHAR(512)          COMMENT '头像URL',
    user_type       TINYINT      NOT NULL DEFAULT 1 COMMENT '用户类型：1博客用户 2管理员 3后台游客',
    status          TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
    login_type      TINYINT      NOT NULL DEFAULT 1 COMMENT '登录类型：1本地 2GitHub 3Gitee',
    oauth_id        VARCHAR(128)          COMMENT '第三方平台用户ID',
    oauth_provider  VARCHAR(32)           COMMENT '第三方平台标识：github/gitee',
    last_login_time DATETIME              COMMENT '最后登录时间',
    last_login_ip   VARCHAR(45)           COMMENT '最后登录IP',
    create_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_type (user_type),
    INDEX idx_oauth (oauth_provider, oauth_id),
    INDEX idx_status (status)
) COMMENT '系统用户表（替代原 admin 表）';

-- 【新增】系统角色表
-- 设计说明：
-- 1. 定义系统中的所有角色，与 Spring Security 中的角色一一对应
-- 2. role_code 约定：ADMIN（管理员）、USER（博客用户）、VISITOR（后台游客）
CREATE TABLE sys_role (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code   VARCHAR(64) NOT NULL UNIQUE COMMENT '角色编码：ADMIN/USER/VISITOR',
    role_name   VARCHAR(64) NOT NULL COMMENT '角色名称',
    description VARCHAR(255) COMMENT '描述',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '角色表';

-- 【新增】用户角色关联表：支持多对多，一个用户可拥有多个角色
-- 设计说明：
-- 1. 管理员可能同时是博客用户，通过此表灵活配置
-- 2. 后续扩展权限时，角色是权限的集合
CREATE TABLE sys_user_role (
    id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID（sys_user.id）',
    role_id BIGINT NOT NULL COMMENT '角色ID（sys_role.id）',

    UNIQUE KEY uk_user_role (user_id, role_id),

    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE
) COMMENT '用户角色关联表';

-- 【新增】权限表：用于方法级细粒度控制（可选，后续扩展）
-- 设计说明：
-- 1. 当前阶段可只使用角色控制，权限表为后续预留
-- 2. permission_code 建议格式：模块:操作，如 article:write、comment:delete
CREATE TABLE sys_permission (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(128) NOT NULL UNIQUE COMMENT '权限编码，如 article:write、system:config',
    permission_name VARCHAR(128) NOT NULL COMMENT '权限名称',
    description     VARCHAR(255) COMMENT '描述',
    create_time     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) COMMENT '权限表';

-- 【新增】角色权限关联表
CREATE TABLE sys_role_permission (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id       BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',

    UNIQUE KEY uk_role_permission (role_id, permission_id),

    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
) COMMENT '角色权限关联表';

-- 【新增】用户登录锁定记录表：替代原 LoginLockService 基于 Redis/内存的实现，支持持久化审计
-- 设计说明：
-- 1. 同时支持按用户ID锁定和按IP锁定
-- 2. 连续登录失败次数、锁定截止时间均持久化，便于审计
CREATE TABLE sys_login_lock (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id        BIGINT COMMENT '用户ID（按IP锁定时可为空）',
    ip_address     VARCHAR(45) NOT NULL COMMENT 'IP地址',
    failed_count   INT NOT NULL DEFAULT 0 COMMENT '连续失败次数',
    lock_until     DATETIME COMMENT '锁定截止时间',
    last_fail_time DATETIME COMMENT '最后一次失败时间',
    create_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_ip (user_id, ip_address),
    INDEX idx_ip (ip_address),
    INDEX idx_lock_until (lock_until)
) COMMENT '登录锁定记录表';

-- 【新增】OAuth2 客户端注册表：Spring Authorization Server 必需
-- 设计说明：
-- 1. 存储所有 OAuth2 客户端配置，如 blog-client、admin-client、github-client
-- 2. 字段含义与 Spring Authorization Server 的 RegisteredClient 一一对应
-- 3. 客户端 secret 需要 BCrypt 加密后存储
-- 4. authorization_grant_types 示例：authorization_code, refresh_token, password
-- 5. scopes 示例：openid, profile, read, write
CREATE TABLE oauth2_registered_client (
    id                            VARCHAR(100) PRIMARY KEY COMMENT '客户端ID（UUID）',
    client_id                     VARCHAR(100) NOT NULL UNIQUE COMMENT '客户端标识，如 blog-client',
    client_id_issued_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '客户端注册时间',
    client_secret                 VARCHAR(200) COMMENT '客户端密钥（BCrypt加密）',
    client_secret_expires_at      TIMESTAMP COMMENT '客户端密钥过期时间',
    client_name                   VARCHAR(200) NOT NULL COMMENT '客户端名称',
    client_authentication_methods VARCHAR(1000) NOT NULL COMMENT '认证方式：client_secret_basic, client_secret_post, none',
    authorization_grant_types     VARCHAR(1000) NOT NULL COMMENT '授权类型：authorization_code, refresh_token, password',
    redirect_uris                 VARCHAR(1000) COMMENT '授权码模式回调地址',
    post_logout_redirect_uris     VARCHAR(1000) COMMENT '登出回调地址',
    scopes                        VARCHAR(1000) NOT NULL COMMENT '作用域：openid, profile, read, write',
    client_settings               VARCHAR(2000) NOT NULL COMMENT '客户端设置（JSON）',
    token_settings                VARCHAR(2000) NOT NULL COMMENT 'Token设置（JSON）'
) COMMENT 'OAuth2 客户端注册表';

-- 【新增】OAuth2 授权记录表：Spring Authorization Server 必需
-- 设计说明：
-- 1. 记录每一次 OAuth2 授权流程，包括授权码、AccessToken、RefreshToken、ID Token
-- 2. 用于授权码校验、Token 刷新、Token 吊销
-- 3. 字段类型为 BLOB，存储序列化后的令牌对象
CREATE TABLE oauth2_authorization (
    id                            VARCHAR(100) PRIMARY KEY COMMENT '授权记录ID',
    registered_client_id          VARCHAR(100) NOT NULL COMMENT '客户端ID',
    principal_name                VARCHAR(200) NOT NULL COMMENT '用户标识（username）',
    authorization_grant_type      VARCHAR(100) NOT NULL COMMENT '授权类型',
    authorized_scopes             VARCHAR(1000) COMMENT '授权的作用域',
    attributes                    BLOB COMMENT '授权属性（序列化）',
    state                         VARCHAR(500) COMMENT '授权码模式中的 state 参数',
    authorization_code_value      BLOB COMMENT '授权码值',
    authorization_code_issued_at  TIMESTAMP COMMENT '授权码签发时间',
    authorization_code_expires_at TIMESTAMP COMMENT '授权码过期时间',
    authorization_code_metadata   BLOB COMMENT '授权码元数据',
    access_token_value            BLOB COMMENT 'AccessToken 值',
    access_token_issued_at        TIMESTAMP COMMENT 'AccessToken 签发时间',
    access_token_expires_at       TIMESTAMP COMMENT 'AccessToken 过期时间',
    access_token_metadata         BLOB COMMENT 'AccessToken 元数据',
    access_token_type             VARCHAR(100) COMMENT 'Token 类型',
    access_token_scopes           VARCHAR(1000) COMMENT 'AccessToken 作用域',
    oidc_id_token_value           BLOB COMMENT 'OIDC ID Token 值',
    oidc_id_token_issued_at       TIMESTAMP COMMENT 'ID Token 签发时间',
    oidc_id_token_expires_at      TIMESTAMP COMMENT 'ID Token 过期时间',
    oidc_id_token_metadata        BLOB COMMENT 'ID Token 元数据',
    refresh_token_value           BLOB COMMENT 'RefreshToken 值',
    refresh_token_issued_at       TIMESTAMP COMMENT 'RefreshToken 签发时间',
    refresh_token_expires_at      TIMESTAMP COMMENT 'RefreshToken 过期时间',
    refresh_token_metadata        BLOB COMMENT 'RefreshToken 元数据',

    INDEX idx_principal (principal_name),
    INDEX idx_client_id (registered_client_id)
) COMMENT 'OAuth2 授权记录表';

-- 【新增】OAuth2 授权同意记录表：Spring Authorization Server 必需
-- 设计说明：
-- 1. 记录用户对某个客户端授予了哪些权限
-- 2. 用于 OIDC / OAuth2 授权码模式中的 consent 页面
CREATE TABLE oauth2_authorization_consent (
    registered_client_id VARCHAR(100) NOT NULL COMMENT '客户端ID',
    principal_name       VARCHAR(200) NOT NULL COMMENT '用户标识',
    authorities          VARCHAR(1000) NOT NULL COMMENT '授予的权限集合',

    PRIMARY KEY (registered_client_id, principal_name)
) COMMENT 'OAuth2 授权同意记录表';

-- ============================================================
-- 二、系统管理相关表
-- ============================================================

-- 【改造】操作日志表：admin_id 改为 user_id，且非空（操作必须登录）
-- 设计说明：
-- 1. 原 admin_id 改为 user_id，关联 sys_user.id
-- 2. 所有后台管理操作必须登录后才能执行，因此 user_id 非空
CREATE TABLE operation_logs (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id          BIGINT NOT NULL COMMENT '操作用户ID（sys_user.id，替代原 admin_id）',
    operation_type   VARCHAR(20) COMMENT '操作类型',
    operation_target VARCHAR(100) COMMENT '操作目标(模块)',
    target_id        BIGINT COMMENT '目标ID',
    operate_data     JSON COMMENT '操作数据',
    result           TINYINT COMMENT '操作结果，0-失败，1-成功',
    error_message    TEXT COMMENT '错误信息',
    operation_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address       VARCHAR(45) COMMENT '操作IP',

    INDEX idx_user_time (user_id, operation_time DESC),
    INDEX idx_type_time (operation_type, operation_time DESC),

    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT '操作日志表';

-- 系统配置表（保持不变）
CREATE TABLE system_config (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key  VARCHAR(50) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type  VARCHAR(20) COMMENT '配置类型,string,number,boolean,json,date',
    description VARCHAR(255) COMMENT '配置描述',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '系统配置表';

-- ============================================================
-- 三、主页相关表
-- ============================================================

-- 个人信息表（保持不变）
CREATE TABLE personal_info (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    nickname    VARCHAR(20) NOT NULL COMMENT '昵称',
    tag         VARCHAR(30) NOT NULL COMMENT '标签',
    description VARCHAR(50) COMMENT '个人简介',
    avatar      VARCHAR(255) COMMENT '头像url',
    website     VARCHAR(100) COMMENT '个人网站',
    email       VARCHAR(50) COMMENT '电子邮箱',
    github      VARCHAR(100) COMMENT 'GitHub',
    location    VARCHAR(50) COMMENT '所在地',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '个人信息表';

-- 社交媒体表（保持不变）
CREATE TABLE social_media (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(20) NOT NULL COMMENT '名称',
    icon        VARCHAR(50) COMMENT '图标类名',
    link        VARCHAR(100) COMMENT '链接',
    sort        INT COMMENT '排序，越小越靠前',
    is_visible  TINYINT DEFAULT 1 COMMENT '是否可见',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '社交媒体表';

-- ============================================================
-- 四、简历相关表
-- ============================================================

-- 经历表（保持不变）
CREATE TABLE experiences (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    type        TINYINT NOT NULL COMMENT '类型，0-教育经历，1-实习及工作经历,2-项目经历',
    title       VARCHAR(50) NOT NULL COMMENT '标题,公司名/学校名/项目名',
    subtitle    VARCHAR(100) COMMENT '副标题,职位/专业/项目角色',
    logo_url    VARCHAR(255) COMMENT 'logo/校徽',
    content     TEXT NOT NULL COMMENT '内容',
    start_date  DATE NOT NULL COMMENT '开始时间',
    end_date    DATE COMMENT '结束时间',
    is_visible  TINYINT DEFAULT 1 COMMENT '是否可见',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_time (start_date DESC)
) COMMENT '经历表';

-- 技能表（保持不变）
CREATE TABLE skills (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(20) NOT NULL COMMENT '技能名称',
    description VARCHAR(255) COMMENT '技能描述',
    icon        VARCHAR(255) COMMENT '图标url',
    sort        INT COMMENT '排序，越小越靠前',
    is_visible  TINYINT DEFAULT 1 COMMENT '是否可见',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '技能表';

-- ============================================================
-- 五、博客相关表
-- ============================================================

-- 【改造】访客表：仅用于访问统计，不再与评论、点赞、留言等业务操作关联
-- 设计说明：
-- 1. 保留 visitors 表用于 PV/UV 统计、访客分析
-- 2. 删除与 article_comments、article_likes、messages、rss_subscriptions 的外键关联
-- 3. 匿名用户的数据只记录在这里，不能用于任何交互操作
CREATE TABLE visitors (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '访客ID',
    fingerprint      VARCHAR(150) NOT NULL COMMENT '访客指纹,用于唯一标识访客',
    session_id       VARCHAR(100) COMMENT '会话ID(当前浏览器会话)',
    ip               VARCHAR(45) NOT NULL COMMENT 'IP地址',
    user_agent       TEXT COMMENT '用户代理',
    country          VARCHAR(25) COMMENT '国家',
    province         VARCHAR(25) COMMENT '省份',
    city             VARCHAR(25) COMMENT '城市',
    first_visit_time DATETIME COMMENT '首次访问时间',
    last_visit_time  DATETIME COMMENT '最后访问时间',
    total_views      INT COMMENT '访问次数',
    is_blocked       TINYINT COMMENT '是否被封禁,0-否，1-是',
    expires_at       DATETIME COMMENT '封禁结束时间',
    create_time      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX uk_visitor_fingerprint (fingerprint),
    INDEX idx_session_id (session_id),
    INDEX idx_last_visit (last_visit_time DESC),
    INDEX idx_create_time (create_time)
) COMMENT '访客表（仅用于访问统计）';

-- 浏览表（保持不变）
CREATE TABLE views (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    visitor_id  BIGINT COMMENT '访客ID',
    page_path   VARCHAR(100) COMMENT '页面路径',
    referer     VARCHAR(255) COMMENT '来源URL',
    page_title  VARCHAR(100) COMMENT '页面标题',
    ip_address  VARCHAR(45) COMMENT 'IP地址',
    user_agent  TEXT COMMENT '用户代理',
    view_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_view_time (view_time DESC),
    INDEX idx_visitor_time (visitor_id, view_time DESC),
    INDEX idx_page_date (page_path(50), view_time),

    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
) COMMENT '浏览表';

-- 文章分类表（保持不变）
CREATE TABLE article_categories (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(20) NOT NULL COMMENT '分类名称,如：日常,心得,年度总结,编程,面经',
    slug        VARCHAR(20) NOT NULL COMMENT 'URL标识，如：daily, thinking, year-summary, programming, interview',
    description VARCHAR(100) COMMENT '分类描述',
    sort        INT DEFAULT 0 COMMENT '排序，越小越靠前',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '文章分类表';

-- 文章表：支持多作者协作 + 管理员审核 + 多状态管理
-- 设计说明：
-- 1. 文章本身不直接存储作者，作者通过 article_authors 关联表维护
-- 2. 文章状态：0草稿 1待审核 2已发布 3违规，发布前必须管理员审核
-- 3. 文章置顶（is_top）仅管理员可设置
-- 4. 作者始终可见自己的文章（含草稿、待审核、违规），已发布文章对所有人公开
-- 5. 发布前由第一作者或管理员提交审核
CREATE TABLE articles (
    id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    title             VARCHAR(50) NOT NULL COMMENT '文章标题',
    slug              VARCHAR(50) UNIQUE NOT NULL COMMENT 'URL标识，如：what-is-slug-field',
    summary           TEXT COMMENT '文章摘要',
    cover_image       VARCHAR(255) COMMENT '封面图片url',
    content_markdown  LONGTEXT NOT NULL COMMENT 'Markdown内容',
    content_html      LONGTEXT NOT NULL COMMENT '转换后的HTML内容',
    category_id       BIGINT COMMENT '分类ID',
    view_count        INT DEFAULT 0 COMMENT '浏览次数',
    like_count        INT DEFAULT 0 COMMENT '点赞次数',
    comment_count     INT DEFAULT 0 COMMENT '评论数',
    word_count        INT DEFAULT 0 COMMENT '字数统计',
    reading_time      INT DEFAULT 0 COMMENT '预计阅读时间，单位：分钟',
    status            TINYINT DEFAULT 0 COMMENT '文章状态：0草稿 1待审核 2已发布 3违规',
    is_top            TINYINT DEFAULT 0 COMMENT '是否置顶：0否 1是（仅管理员可设置）',
    submit_time       DATETIME COMMENT '提交审核时间',
    publish_time      DATETIME COMMENT '发布时间（审核通过后自动设置）',
    publish_year      INT GENERATED ALWAYS AS (IFNULL(YEAR(publish_time), 0)) STORED COMMENT '发布年份',
    publish_month     INT GENERATED ALWAYS AS (IFNULL(MONTH(publish_time), 0)) STORED COMMENT '发布月份',
    publish_day       INT GENERATED ALWAYS AS (IFNULL(DAY(publish_time), 0)) STORED COMMENT '发布日期',
    publish_date      DATE GENERATED ALWAYS AS (IFNULL(DATE(publish_time), NULL)) STORED COMMENT '发布日期（去掉时间）',
    create_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status_publish_time (status, publish_time DESC),
    INDEX idx_publish_date (publish_date DESC),
    INDEX idx_category_status (category_id, status, publish_time DESC),
    INDEX idx_top_status (is_top, status, publish_time DESC),
    INDEX idx_slug (slug),
    INDEX idx_view_count (view_count DESC),
    FULLTEXT idx_fulltext (title, summary, content_markdown(500)),

    FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL
) COMMENT '文章表（多作者 + 审核）';

-- 文章标签表（保持不变）
CREATE TABLE article_tags (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(20) NOT NULL COMMENT '标签名称',
    slug        VARCHAR(30) NOT NULL COMMENT 'URL标识',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX uk_tag_name (name),
    UNIQUE INDEX uk_tag_slug (slug)
) COMMENT '文章标签表';

-- 文章-标签关联表（保持不变）
CREATE TABLE article_tag_relations (
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id BIGINT NOT NULL COMMENT '文章ID',
    tag_id     BIGINT NOT NULL COMMENT '标签ID',

    UNIQUE INDEX uk_article_tag (article_id, tag_id),
    INDEX idx_tag_id (tag_id),

    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES article_tags(id) ON DELETE CASCADE
) COMMENT '文章-标签关联表';

-- 【新增】文章-作者关联表：支持多作者协作 + 邀请机制 + 编辑权限控制
-- 设计说明：
-- 1. 一篇文章可关联多个作者，实现共同创作、客座作者等场景
-- 2. author_role 字段区分作者角色：1-第一作者 2-共同作者 3-通讯作者 9-其他
-- 3. 第一作者拥有最高权限：可邀请/移除其他作者、提交审核、撤回草稿
-- 4. can_edit 字段控制共同作者是否能修改文章内容
-- 5. invite_status 字段记录邀请状态：0待接受 1已接受 2已拒绝 3已移除
-- 6. invited_by 记录邀请人（通常为第一作者）
CREATE TABLE article_authors (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id    BIGINT NOT NULL COMMENT '文章ID',
    user_id       BIGINT NOT NULL COMMENT '作者ID（sys_user.id）',
    author_role   TINYINT NOT NULL DEFAULT 2 COMMENT '作者角色：1第一作者 2共同作者 3通讯作者 9其他',
    can_edit      TINYINT NOT NULL DEFAULT 1 COMMENT '是否有编辑权限：0否 1是（仅对共同作者生效，第一作者默认有权限）',
    invite_status TINYINT NOT NULL DEFAULT 1 COMMENT '邀请状态：0待接受 1已接受 2已拒绝 3已移除',
    invited_by    BIGINT COMMENT '邀请人ID（sys_user.id），通常为第一作者',
    sort          INT NOT NULL DEFAULT 0 COMMENT '展示排序，越小越靠前',
    create_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX uk_article_user (article_id, user_id),
    INDEX idx_article_sort (article_id, sort),
    INDEX idx_user_articles (user_id, create_time DESC),
    INDEX idx_invite_status (invite_status),

    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES sys_user(id) ON DELETE SET NULL
) COMMENT '文章-作者关联表（多作者协作 + 邀请机制）';

-- 【新增】文章审核记录表：记录每次提交审核、审核通过、审核拒绝、违规标记等操作
-- 设计说明：
-- 1. 每次文章状态变更（提交审核、审核通过、审核拒绝、标记违规、撤销违规）都记录一条
-- 2. operator_id 为操作人ID（管理员或第一作者）
-- 3. reason 字段记录审核意见或违规原因
-- 4. 便于后续审计和作者申诉
CREATE TABLE article_audit_logs (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id  BIGINT NOT NULL COMMENT '文章ID',
    operator_id BIGINT NOT NULL COMMENT '操作人ID（sys_user.id）',
    from_status TINYINT COMMENT '变更前状态：0草稿 1待审核 2已发布 3违规',
    to_status   TINYINT NOT NULL COMMENT '变更后状态：0草稿 1待审核 2已发布 3违规',
    reason      VARCHAR(500) COMMENT '审核意见/违规原因/操作说明',
    ip_address  VARCHAR(45) COMMENT '操作IP',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_article_id (article_id, create_time DESC),
    INDEX idx_operator_id (operator_id, create_time DESC),

    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT '文章审核记录表';

-- 【全新设计】文章评论表：
-- 1. 删除 visitor_id、nickname、email_or_qq 等匿名字段
-- 2. 只保留 user_id，且非空，评论必须登录
-- 3. 评论者昵称、头像、邮箱统一从 sys_user 表获取
-- 4. is_secret 字段含义由"是否匿名"修正为"是否悄悄话"：仅博主和评论者可见
-- 5. 前端未登录时点击评论按钮，统一引导登录
CREATE TABLE article_comments (
    id                 BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id         BIGINT NOT NULL COMMENT '文章ID',
    root_id            BIGINT COMMENT '根评论ID，null是一级评论',
    parent_id          BIGINT COMMENT '父评论ID，null是一级评论',
    parent_nickname    VARCHAR(64) COMMENT '父评论昵称（冗余，便于展示）',
    content            TEXT NOT NULL COMMENT '评论内容',
    content_html       TEXT NOT NULL COMMENT '转换后的HTML内容',
    user_id            BIGINT NOT NULL COMMENT '评论用户ID（sys_user.id），必须登录',
    location           VARCHAR(30) COMMENT '地址',
    user_agent_os      VARCHAR(20) COMMENT '操作系统名称',
    user_agent_browser VARCHAR(20) COMMENT '浏览器名称',
    is_approved        TINYINT DEFAULT 0 COMMENT '是否审核通过，0-否，1-是',
    is_markdown        TINYINT DEFAULT 0 COMMENT '是否使用markdown，0-否，1-是',
    is_secret          TINYINT DEFAULT 0 COMMENT '是否悄悄话：0-否，1-是（仅博主和评论者可见）',
    is_notice          TINYINT DEFAULT 0 COMMENT '有回复是否通知，0-否，1-是',
    is_edited          TINYINT DEFAULT 0 COMMENT '是否编辑过，0-否，1-是',
    is_admin_reply     TINYINT DEFAULT 0 COMMENT '是否为管理员回复，0-否，1-是',
    create_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_article_status (article_id, is_approved, create_time DESC),
    INDEX idx_parent (parent_id DESC),
    INDEX idx_root (root_id DESC),
    INDEX idx_approved (is_approved, create_time DESC),
    INDEX idx_user_id (user_id),

    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT '文章评论表（必须登录）';

-- 【全新设计】文章点赞表：
-- 1. 删除 visitor_id，不再支持匿名点赞
-- 2. 只保留 user_id，且非空，点赞必须登录
-- 3. 同一用户对同一文章只能点赞一次
CREATE TABLE article_likes (
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id BIGINT NOT NULL COMMENT '文章ID',
    user_id    BIGINT NOT NULL COMMENT '点赞用户ID（sys_user.id），必须登录',
    like_time  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE INDEX uk_article_user (article_id, user_id),
    INDEX idx_article (article_id, like_time DESC),

    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT '文章点赞表（必须登录）';

-- 【全新设计】RSS订阅记录表：
-- 1. 删除 visitor_id，不再支持匿名订阅
-- 2. 只保留 user_id，且非空，订阅必须登录
-- 3. nickname 和 email 从 sys_user 同步，保持数据一致性
CREATE TABLE rss_subscriptions (
    id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id           BIGINT NOT NULL COMMENT '用户ID（sys_user.id），必须登录',
    nickname          VARCHAR(64) NOT NULL COMMENT '昵称（从 sys_user 同步）',
    email             VARCHAR(128) NOT NULL COMMENT '邮箱（从 sys_user 同步）',
    is_active         TINYINT DEFAULT 1 COMMENT '是否激活，0-否，1-是',
    subscribe_time    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    un_subscribe_time DATETIME COMMENT '取消订阅时间',

    UNIQUE INDEX uk_user_id (user_id),
    INDEX idx_email (email),

    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT 'RSS订阅记录表（必须登录）';

-- 友链表（保持不变）
CREATE TABLE friend_links (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(20) NOT NULL COMMENT '网站名称',
    url         VARCHAR(100) NOT NULL COMMENT '网站地址',
    avatar_url  VARCHAR(255) COMMENT '头像url',
    description VARCHAR(255) COMMENT '网站描述',
    sort        INT DEFAULT 0 COMMENT '排序，越小越靠前',
    is_visible  TINYINT DEFAULT 1 COMMENT '是否可见',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '友情链接表';

-- 【全新设计】留言表：
-- 1. 删除 visitor_id、nickname、email_or_qq 等匿名字段
-- 2. 只保留 user_id，且非空，留言必须登录
-- 3. 留言者昵称、头像、邮箱统一从 sys_user 表获取
-- 4. is_secret 字段含义由"是否匿名"修正为"是否悄悄话"：仅博主和留言者可见
-- 5. 前端未登录时点击留言按钮，统一引导登录
CREATE TABLE messages (
    id                 BIGINT PRIMARY KEY AUTO_INCREMENT,
    content            TEXT NOT NULL COMMENT '留言内容',
    content_html       TEXT NOT NULL COMMENT '转换后的HTML内容',
    root_id            BIGINT COMMENT '根留言ID，null是一级留言',
    parent_id          BIGINT COMMENT '父留言ID，null是一级留言',
    parent_nickname    VARCHAR(64) COMMENT '父留言昵称（冗余，便于展示）',
    user_id            BIGINT NOT NULL COMMENT '留言用户ID（sys_user.id），必须登录',
    location           VARCHAR(30) COMMENT '地址',
    user_agent_os      VARCHAR(20) COMMENT '操作系统名称',
    user_agent_browser VARCHAR(20) COMMENT '浏览器名称',
    is_approved        TINYINT DEFAULT 0 COMMENT '是否审核通过，0-否，1-是',
    is_markdown        TINYINT DEFAULT 0 COMMENT '是否使用markdown，0-否，1-是',
    is_secret          TINYINT DEFAULT 0 COMMENT '是否悄悄话：0-否，1-是（仅博主和留言者可见）',
    is_notice          TINYINT DEFAULT 0 COMMENT '有回复是否通知，0-否，1-是',
    is_edited          TINYINT DEFAULT 0 COMMENT '是否编辑过，0-否，1-是',
    is_admin_reply     TINYINT DEFAULT 0 COMMENT '是否为管理员回复，0-否，1-是',
    create_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_approved (is_approved, create_time DESC),

    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
) COMMENT '留言表（必须登录）';

-- 音乐表（保持不变）
CREATE TABLE music (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(50) NOT NULL COMMENT '音乐标题',
    artist      VARCHAR(50) COMMENT '作者',
    duration    INT COMMENT '时长，单位：秒',
    cover_image VARCHAR(255) COMMENT '封面图片url',
    music_url   VARCHAR(255) NOT NULL COMMENT '音频文件url',
    lyric_url   VARCHAR(255) COMMENT '歌词文件url',
    has_lyric   TINYINT DEFAULT 0 COMMENT '是否有歌词，0-否，1-是',
    lyric_type  VARCHAR(10) COMMENT '歌词类型,lrc,json,txt',
    sort        INT COMMENT '排序，越小越靠前',
    is_visible  TINYINT DEFAULT 1 COMMENT '是否可见',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_sort_visible (sort, is_visible, id DESC)
) COMMENT '音乐表';

-- ============================================================
-- 六、初始数据
-- ============================================================

-- 插入初始角色
INSERT INTO sys_role (role_code, role_name, description) VALUES
('ADMIN', '管理员', '后台管理员，拥有全部管理权限'),
('VISITOR', '后台游客', '后台游客账号，仅允许只读查询'),
('USER', '博客用户', '博客端登录用户，可评论、留言、点赞、订阅');

-- 插入管理员账号（password 需使用 BCryptPasswordEncoder 生成）
-- 示例：使用 Spring Security 的 BCryptPasswordEncoder 生成 password 字段
INSERT INTO sys_user (username, password, nickname, email, user_type, status, login_type, create_time, update_time)
VALUES ('admin', '$2a$10$...', '管理员', 'admin@example.com', 2, 1, 1, NOW(), NOW());

-- 将管理员关联到 ADMIN 角色
INSERT INTO sys_user_role (user_id, role_id)
VALUES (
    (SELECT id FROM sys_user WHERE username = 'admin'),
    (SELECT id FROM sys_role WHERE role_code = 'ADMIN')
);

-- 插入后台游客账号（可选）
INSERT INTO sys_user (username, password, nickname, email, user_type, status, login_type, create_time, update_time)
VALUES ('visitor', '$2a$10$...', '游客', '', 3, 1, 1, NOW(), NOW());

-- 将游客关联到 VISITOR 角色
INSERT INTO sys_user_role (user_id, role_id)
VALUES (
    (SELECT id FROM sys_user WHERE username = 'visitor'),
    (SELECT id FROM sys_role WHERE role_code = 'VISITOR')
);

-- 系统配置项
INSERT INTO system_config (config_key, config_value, config_type, description, create_time, update_time) VALUES
('icp-beian', 'xxx', 'string', 'icp备案', NOW(), NOW()),
('gongan-beian', 'xxx', 'string', '公安备案', NOW(), NOW()),
('start-time', 'xxxx-xx-xx', 'string', '网站建立时间', NOW(), NOW());

-- ============================================================
-- 七、数据迁移说明（从旧库迁移到新库时使用）
-- ============================================================

-- 【迁移】将原 admin 表数据迁移到 sys_user 和 sys_user_role
-- 注意：原 admin.password 是自定义哈希，迁移后需使用双轨验证策略逐步升级为 BCrypt
-- INSERT INTO sys_user (username, password, nickname, email, user_type, status, login_type, create_time, update_time)
-- SELECT username, password, nickname, email,
--        CASE WHEN role = 1 THEN 2 ELSE 3 END AS user_type,
--        1 AS status,
--        1 AS login_type,
--        create_time,
--        update_time
-- FROM admin;

-- 【迁移】将原 admin 的角色关联迁移到 sys_user_role
-- INSERT INTO sys_user_role (user_id, role_id)
-- SELECT u.id, r.id
-- FROM sys_user u
-- JOIN sys_role r ON r.role_code = CASE
--     WHEN u.user_type = 2 THEN 'ADMIN'
--     WHEN u.user_type = 3 THEN 'VISITOR'
-- END;

-- 【迁移】将原 operation_logs.admin_id 映射到 operation_logs.user_id
-- UPDATE operation_logs ol
-- JOIN sys_user u ON u.id = ol.admin_id
-- SET ol.user_id = u.id;

-- ============================================================
-- 八、修改点汇总
-- ============================================================
-- 【删除】admin 表：合并到 sys_user 表，通过 user_type 区分管理员/游客/博客用户
-- 【新增】sys_user 表：统一用户体系
-- 【新增】sys_role 表：角色定义
-- 【新增】sys_user_role 表：用户角色多对多关联
-- 【新增】sys_permission 表：细粒度权限（可选）
-- 【新增】sys_role_permission 表：角色权限关联（可选）
-- 【新增】sys_login_lock 表：登录锁定记录，便于审计
-- 【新增】oauth2_registered_client 表：OAuth2 客户端注册（Spring Authorization Server 必需）
-- 【新增】oauth2_authorization 表：OAuth2 授权记录（Spring Authorization Server 必需）
-- 【新增】oauth2_authorization_consent 表：OAuth2 授权同意记录（Spring Authorization Server 必需）
-- 【改造】operation_logs：admin_id -> user_id（非空，操作必须登录）
-- 【改造】articles 表：is_published 改为 status 字段（草稿/待审核/已发布/违规），新增 submit_time
-- 【新增】article_authors 表：文章-作者多对多关联，支持邀请机制、编辑权限控制
-- 【新增】article_audit_logs 表：记录文章审核状态变更历史
-- 【全新设计】article_comments：删除 visitor_id/nickname/email_or_qq，仅 user_id，必须登录评论
-- 【全新设计】article_likes：删除 visitor_id，仅 user_id，必须登录点赞
-- 【全新设计】messages：删除 visitor_id/nickname/email_or_qq，仅 user_id，必须登录留言
-- 【全新设计】rss_subscriptions：删除 visitor_id，仅 user_id，必须登录订阅
-- 【修正】article_comments.is_secret / messages.is_secret：含义从"是否匿名"改为"是否悄悄话"
-- 【限制】visitors 表仅用于访问统计，不再参与任何业务操作
-- ============================================================
