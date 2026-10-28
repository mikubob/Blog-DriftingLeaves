# 后端迁移与运行（2026-10-27）

本次没有连接或迁移业务服务。以下操作由部署者对明确选中的环境执行；不要直接启动本机被忽略的 YAML 默认 profile 来测试。

## 配置和建库

JDK 21、MySQL 8、Redis、SMTP 和 OSS 沿用现有依赖。无密配置在 `docs/application-example.properties`；部署环境提供该文件列出的 `DL_*` 环境变量，JWT secret 至少32字节且随机生成，不使用示例常量。现有站点共享访客身份时复用同一访客 Token；前端自行统一可信站点之间的浏览器存储。

新空库：选择数据库后先执行 `DL-server/src/main/resources/sql/schema.sql`，再执行既有 `20261026_expand_social_icon.sql` 和 `20261027_backend_integrity.sql`。schema 仅含从现有建表文件提取的 DDL，不含真实账号、哈希、盐或用户数据。自行初始化 personal_info 的 id=1、公开 system_config 展示键和管理员账号。现有密码算法仍为 SHA-256(password+salt)，未擅自实施第6节的密码算法迁移；管理员初始哈希/随机盐应在可信环境用现有 EncryptPasswordService 生成，勿从本机旧 SQL 拷贝账号数据。

构建：`mvn -o test`；打包：`mvn -o package`。从 Backend 根启动：`java -jar DL-server/target/DL-server-1.0-SNAPSHOT.jar --spring.config.location=file:docs/application-example.properties`。实际监听端口、站点 URL、TLS/代理、SMTP/OSS 权限由部署环境指定。

## 升级现有库

1. 备份并检查业务表均使用 InnoDB。读取迁移文件中的两条重复检查，对重复邮箱及同访客多条订阅人工确定保留、解绑与历史记录处理方式。无自动删除/去重脚本。email 唯一索引采用大小写不敏感规则；先核对 TRIM 后相同的邮箱，再规范历史邮箱空格。
2. 停止旧计数任务/写入实例后执行迁移。新批次表需与 articles 在同一事务数据源，不能被排除在事务之外；新旧二进制不能同时消费相同增量。
3. 发布配套前端与后端；契约见 implementation-api-contract-2026-10-27.md。旧 JWT 设备 Set 不复用到 v2 ZSet，管理端需要重新登录；旧邮件验证码不再使用，等冷却期后重新发送。旧集合按原TTL自然过期，无需清空 Redis。
4. 旧访客设备指纹不构成新凭据，不自动认领旧内容或订阅。原记录保留；管理员仍可查看/审核。旧订阅 confirmed=0，因此停止发送新文章通知，邮箱所有者需重新确认后恢复。后台改邮箱同样撤销确认，后台不能把未确认邮箱强行启用。

## 计数、缓存与回滚

Redis 仍保留当前总待同步增量；`:batches` 保存稳定批次，MySQL receipt 与计数修改在同一事务提交，之后 Lua 只扣除匹配批次的增量。确认失败可重试，锁租约到期也不会重复记同一批次；所有者比较删除保护后继锁。保留快照之后的新请求和负点赞增量。receipt 不自动清理：只在确保没有旧进程/备份重放该批次且完成对账后制定归档，不能按普通TTL删除。

统计页面使用新鲜数据库基数加 Redis 增量，不再长期缓存文章列表、详情和热门计数。跨存储提交/确认的短窗口仍可能暂时双计或读到跨时刻结果；最终落库按批次去重，不承诺瞬时强一致。热门排名仍依据数据库已落库计数，最多延迟一次同步周期。

保留文章相关静态缓存，使用业务失效注解及事务感知 RedisCacheManager 在成功提交后驱逐。旧 articleList/articleDetail/hotArticles 缓存不再读取，按原TTL过期。

回滚前停止写入，使用新版同步任务处理完 pending batches，并核对 Redis 增量、receipt 与文章基数；不要让旧任务重放已提交但未确认的批次。新增表/列/索引可以先保留，通常无需删表。确需结构回退时，应先备份新增确认状态及去重记录，再由部署者移除唯一索引、confirmed/confirmation_id 和新索引；只有确认全部批次已结束才可归档 counter_sync_batches。不要回滚到会泄露私密内容或信任 visitorId 的旧公开接口。

## 验证边界与待核实部署约定

默认单元测试不读取本机 YAML，不连接真实 MySQL/Redis/SMTP/OSS。额外 `-DisolatedServices=true` 测试会自行启动临时 Redis/MySQL，仅监听回环随机端口，使用全新数据目录；可通过 isolated.redis.executable、isolated.mysql.executable 指定安装路径。进程在测试结束时停止，日志/数据留在 DL-server/target 下供排查。

仍需部署核实：实际 CORS 来源、Nginx 覆盖代理头及禁止直连、转发 HTTPS 后 Secure Cookie、公开 system_config 的数据范围、Redis写入方可信性、日期分钟精度、报表区间累计口径、本月热门含义、多实例监控/在线连接数和快捷保存是否撤稿。没有将这些未确定事项实现成新功能。接口限流桶有容量和闲置寿命，当前为每实例本地限流；Redis访客自动封禁规则继续保留，实际封禁为403，普通接口短暂限流为429。
