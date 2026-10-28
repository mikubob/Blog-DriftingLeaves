# 后端规范与质量整改（2026-10-27 批次）

实施及验证日期：2026-10-28。基于上一轮全部未提交源码与测试继续整改，使用 Ponytail full 和 Stop That Shit change。未 reset/revert，未提交、推送、部署；前端只读核对，API 路径、字段及状态契约不变。

## 职责、分层与文档

| 原位置 | 最终位置及职责 |
|---|---|
| server/service/CaptchaService | 保留为接口，server/service/impl/CaptchaServiceImpl 实现访客绑定、五分钟一次性挑战 |
| server/service/VisitorTokenService | 保留为接口，server/service/impl/VisitorTokenServiceImpl 实现目的隔离的访客 JWT |
| server/service/CounterBatchWriter | 保留为接口，server/service/impl/CounterBatchWriterImpl 通过独立事务代理提交批次及文章计数 |
| server/service/CommitActions | common/utils/CommitActions，无状态的提交回调工具 |
| server/service/CounterSyncService | server/task/CounterSyncCoordinator，调度协调组件，保留稳定批次与所有者锁，不机械增加 Service 接口 |
| server/service/ArticleCountReader | server/mapper/ArticleCountReader，Redis 批量读取及展示计数组装组件 |

表中 common/server 分别指 DL-common/DL-server 的 com.xuan 包。所有业务调用者依赖三个服务接口；同步任务、拦截器、控制器、文章/评论/留言实现、测试显式 Spring 注册及手工构造调用已一起调整。旧的三个工具/协调/读取类源路径移除，避免同名 Bean 并存。未新增依赖，DL-common 不依赖 DL-server。

补齐上一轮变更中的类职责与业务方法 Javadoc，包括上下文、内容/邮件/Markdown/JWT 工具、Mapper 锁与增量操作、分页入口、验证码、访客凭据、订阅、异步审计和计数任务。服务契约说明身份来源、旧 visitorId 参数仅兼容、编辑重审、私密祖先、提交后通知、预约标识与一次消费；修正旧的“按 email 退订”等失效说明及创建文章遗漏的返回 ID。实现方法沿用 @Override 继承接口文档。简单私有取值/键拼接方法及未修改的历史方法不堆模板注释。

## 直接修正的质量问题

- 评论和留言回复曾只检查父节点与根节点，历史公开后代可能位于不可见的中间祖先下。现在在原有事务锁内校验完整祖先链，拒绝缺失、错根和循环关系，逐级检查访客可见性，并继承中间祖先的私密限制及管理员回复归属。没有以接口重排替代授权校验。
- RSS 退订原先把数据库异常一并包装成无效链接。现在只转换 JWT/凭据解析失败，数据库故障继续交给异常处理器报告服务失败；条件更新还匹配空 confirmation_id，防止旧 legacy 凭据在读取之后取消并发重新确认的订阅。重复退订仍幂等。
- 管理端 RSS 更新以事务行锁读取当前确认状态，避免读取旧状态后启用已被并发换邮箱撤销确认的记录。
- 文章发布及编辑在事务内锁定文章后判断首次发布，避免并发请求重复触发首次发布邮件；保留提交后通知和统计字段不回写。
- 清理 requireId 之后不可达的空身份分支、失效依赖说明及受影响代码的冗余限定名/未使用 import；没有新增业务功能、通用框架或测试框架。
- 隔离测试夹具原先只停止 MySQL 启动器，Windows 下服务子进程仍可能占用临时目录。现在仅跟踪并停止该夹具创建的子进程树，等待子进程退出；Spring 上下文关闭失败时也进入清理。最初两次运行遗留的隔离 MySQL 已按完整 datadir 命令行核对后停止，未触及其他数据库进程。

既有稳定批次去重、提交后 Redis 确认重试、租约重叠保护、负点赞增量、私密读取、访客凭据、编辑重审、邮箱确认及服务端验证码继续由原回归覆盖。新增 5 项测试覆盖完整祖先链/私密继承及循环、旧退订凭据与确认交错、数据库异常传播、并发首次发布只通知一次、提交回调在事务提交/回滚/无事务三种路径。

## 验证与同步

JDK 21：`D:\CodeEnvironment\JDK21\jdk-21.0.9`。Maven 使用已有离线缓存；隔离测试自行初始化全新 MySQL/Redis 数据目录、127.0.0.1 随机端口，不加载本机 Spring profile。SMTP/OSS 仍使用模拟对象。

- 源项目 `mvn -o test -DisolatedServices=true`：74 项通过，0 失败、0 错误、0 跳过（20 图标、15 后端回归、26 隔离服务、9 计数、4 Markdown）。日志 `tmp/quality/source-final-test.log`。
- 源项目 `mvn -o clean test -DisolatedServices=true`：74 项通过，0 失败、0 错误、0 跳过，四模块 BUILD SUCCESS。日志 `tmp/quality/source-clean-final-test.log`。
- Website/Backend `mvn -o clean package -DisolatedServices=true`：同样 74 项全部通过，四模块 BUILD SUCCESS，生成 Spring Boot 可执行 JAR。日志 `tmp/quality/website-clean-package.log`。两处测试结束后通过系统进程命令行只读核对，相关测试子进程均已退出；JAR 不含三个已迁移旧类和本地 YAML，common JAR 包含 CommitActions，三个既有 YAML 模板仍在。
- 使用 JDK 编译器文档树核对变更生产源码的类文档、参数名、void/@return 与 Javadoc 语法：通过；`git diff --check` 通过。临时核对工具与日志在忽略的 tmp/quality 下，不加入应用或交付包。
- 交付位置 `D:\CodingFiles\Blog\DriftingLeaves-Website\Backend`：352 个最终映射文件逐一 SHA-256 相同，3 个已迁移旧源码已移除；8 个目标独有文件、214 个 Website 其余文件哈希不变。映射及校验结果在源 `tmp/quality/sync-manifest.json`、`sync-result.json`；测试统计与 JAR 检查结果在 `final-artifact-check.json`。交付说明更新后再同步校验。

开始时源与目标 348 个上一轮映射文件完全相同，8 个保护文件均保持上一轮哈希。此次重新枚举最终文件，不把旧清单直接当作最终状态；只同步明确映射源码、POM、必要资源、测试及 Backend/docs。仅删除三条已迁移且与初始版本一致的旧源码路径，保留目标独有文件、三份安全方案、模板及旧 SQL；不复制本地 YAML、真实账户初始化 SQL、Git、IDE、target、tmp、日志或缓存，不修改 Website 前端、Docker、公共根文件或 Git 元数据。

## 未处理事项及实际边界

未扩展到新业务功能、全仓历史注释治理或前端改造；未连接业务数据库、Redis、真实 SMTP/OSS，未运行生产迁移、浏览器端到端联调或 Linux/Docker 硬件校准。隔离实例验证支持当前事务及 Redis 原子路径，不代表生产配置和负载已验证。

部署仍须按 backend-migration-2026-10-27.md 人工处理 RSS 历史重复数据、执行迁移并停止旧同步任务混跑，核实代理/CORS、Secure Cookie 与邮件链接。计数跨 MySQL/Redis 的短暂读窗口仍非强一致，批次 receipt 不自动清理。这些既有约定未因分层整改改变。
