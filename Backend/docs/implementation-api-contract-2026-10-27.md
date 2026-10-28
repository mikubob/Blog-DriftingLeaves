# 后端实施 API 契约（2026-10-27）

状态：**已确定**（实施中；测试结果另见 backend-implementation-2026-10-27.md）。核对了当前 DTO、Controller 和三个站点访客入口及 Blog/Admin API 消费者。路径均为后端路径，前端代理前缀沿用现状。

继续使用 `Result {code,msg,data}`：成功 code=1，业务失败 code=0；分页继续使用 `PageResult {page,pageSize,total,totalPages,records}`。不新增统一协议。

## 访客身份（R01/R23/R35）

- `POST /blog/visitor/record`、`/home/visitor/record`、`/cv/visitor/record`，原请求不变；data 保留 visitorId、visitorFingerprint、sessionId、isNewVisitor，新增 **visitorToken**。
- 客户端保存 visitorToken，后续三个站点请求以 **`X-Visitor-Token: <visitorToken>`** 传送；同一浏览器复用凭据。凭据为有目的隔离及一年有效期的服务端签名 Token；sessionId、指纹、visitorId 均不能单独证明身份。
- 无凭据的 record 创建随机新身份。无凭据可浏览公开内容；评论/留言写入、点赞读写、订阅状态及变更需要有效凭据。无效/过期凭据返回 HTTP 401；客户端清理凭据后重新 record，等待身份就绪再加载点赞/订阅/本人待审内容。
- 旧 visitorId 参数/DTO 字段继续接收但不参与授权，可省略。旧设备指纹不自动认领旧内容；旧内容仍保留，需管理员处理归属。清空凭据会获得新身份。

## 私密内容、头像与内容格式（R02/R03/R04/R19）

- isSecret=1 表示悄悄话；只向经验证的作者返回，管理员后台可读。回复继承私密线程限制，管理员对私密内容的回复归该线程作者可见。
- Blog 评论/留言 JSON **不返回 emailOrQq**；使用新增 `avatarUrl`（当前 null，前端默认头像），不要再从邮箱/QQ 推导头像。保留 visitorId 作展示兼容，新增 `isOwn` 表示可编辑/删除的归属；前端不再自行用本地 ID 判权限。
- 非 Markdown 为普通文本，服务端转义并保留换行；Markdown 使用现有清理器；历史内容在读取时同样安全处理。编辑后 isApproved=0、isEdited=1，保存 isMarkdown，需要重新审核。
- 删除根节点级联删除整条回复线程；删除非根节点保留后续回复并改挂根节点，私密限制继续继承。
- parentId 是回复目标；rootId/parentNickname 由服务端推导，若传入不匹配 rootId 则拒绝；评论文章必须存在且已发布，父节点属于同一文章。回复隐藏/待审的他人节点不被允许。

## 评论/留言分页（R22）

- 新增 `GET /blog/articleComment/article/{articleId}/page?page=1&pageSize=10` 与 `GET /blog/message/page?page=1&pageSize=10`，data 为 PageResult，records 是根节点，每根 children 包含本页根的可见回复。page>=1，pageSize=1..50；total 按可见根计数。
- 旧 `GET /blog/articleComment/article/{articleId}`、`GET /blog/message` 保持 data 数组，兼容返回第一页（最多10个根）；完整加载请使用新分页入口。原 POST、PUT /edit、DELETE /{id} 路径不变。

## 文章、认证、验证码及错误（R06/R28/R30/R31/R38）

- `POST /admin/article` 成功 **data 为新文章 ID（JSON 数字）**，前端立即回填 form.id；之后 PUT /admin/article。创建忽略客户端 id；更新必须有正 ID 且目标存在。密码登录与改密统一6..32位，允许符号。
- 新增 **`POST /admin/admin/sendChangeEmailCode`**，不需要 body/username，从登录上下文向当前绑定邮箱发送验证码；PUT /admin/admin/changeEmail 保留原字段及旧邮箱验证码含义，不擅自增加新邮箱二次校验流程。
- 管理端 Cookie 认证继续沿用现有方式；设备集合升级到 v2 后旧会话需要重新登录，旧邮件验证码需要重新发送。认证失效 HTTP 401；封禁/游客读取敏感后台资源 HTTP 403；临时限流 **HTTP 429**（Result.error，含 Retry-After）；参数校验 HTTP 400。关系、分页等 ValidationException 为 HTTP 400；其余已有业务失败保留 HTTP 200 + code=0。401 清理前端状态后 replace 登录；429 保留当前页与表单，仅提示一次。
- **保留算术验证码并落实服务端验证**：`GET /blog/common/captcha/generate` 需访客凭据，data `{captchaId,question}`，不返回 result。POST 评论/留言必传 `captchaId`、`captchaAnswer`（字符串，完整整数匹配）；挑战绑定访客、5分钟有效、一次性，错误/过期/复用返回业务失败。编辑不额外加验证码。

## RSS（R20）

- 每访客一份订阅、邮箱唯一；`POST /blog/rssSubscription` 与新增 `PUT /blog/rssSubscription` 接收原 `{nickname,email,visitorId?}`。首次/换邮箱只发送确认邮件，成功 data 不含凭据；同邮箱更新昵称由已验证访客直接完成。未确认不发文章通知；旧订阅不凭数字ID自动认领。
- 邮件确认链接为博客首页 `/?rssConfirm=<token>`，前端检测后调用 **`POST /blog/rssSubscription/confirm?token=...`**（需当前 visitorToken，必须匹配发起访客）；确认票据24小时有效、成功后一次消费，可重试失败的数据库操作。
- `GET /blog/rssSubscription/check` 需 visitorToken，data 保留 `{subscribed,nickname,email}`，已订阅时新增 `unsubscribeToken`；多条旧记录在迁移前需人工去重，读取用确定顺序兼容避免 one() 500。
- **`PUT /blog/rssSubscription/unsubscribe?token=...`** 使用不可伪造且绑定订阅记录的退订凭据，不再接受仅 email 授权退订；邮件链接 `/?rssUnsubscribe=<token>` 由前端提示并调用。退订不依赖访客存储，重复退订幂等。既有文章通知邮件也附此链接。
- SQL 迁移先检查/处理重复数据，再建立邮箱、visitorId 唯一约束；不自动删旧数据，不执行真实迁移。部署前须完成迁移并核实邮件中的 blogUrl。

## 联调与兼容边界

前后端需一并发布访客凭据、验证码、RSS和分页适配；旧客户端可以浏览但不能再凭 visitorId 写入。HTTP 401/403/429 含义需按上述规则处理。后端不依赖前端隐藏按钮执行鉴权。没有修改生产数据库、Redis或邮件配置。
