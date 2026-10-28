# DriftingLeaves 前后端统一代码审查与优化建议

审查日期：2026-10-26。后端基准：当前工作区，HEAD 为 `2ca4478`，包含审查开始时已有的未提交修改与测试。前端仓库位于 `D:\CodingFiles\Blog\DriftingLeavesOfFront`，HEAD 为 `d9cedbb`，包含 Admin、Blog、CV、Home 四个应用。

本次按照 Ponytail full 和 Stop That Shit 的原则审查：沿调用链核实问题，保留必要的权限、校验和错误处理，优先提出能解决问题的最小改动。**本轮只更新本文档，未修改前后端业务代码、配置、数据库或已有测试。所有修复建议均待用户审阅确认后再实施。**只读检查的临时脚本、日志及构建产物保存在后端被忽略的 `tmp/frontend-review` 目录，没有加入项目源码。

## 1. 结论与阅读顺序

优先修复访客身份校验、“悄悄话”与联系方式泄露、未过滤的 HTML、编辑绕过审核、密码日志，以及编辑器离开页面时可能丢稿的问题。这些问题有明确的输入与输出路径，不能靠前端隐藏按钮或内容解决。随后处理改密后无法登录、上传结果错误、草稿保存、登录失效跳转，再解决并发计数、缓存一致性和重复实现。

本文列出 **38 项问题：10 项 P1、28 项 P2**，另有函数嵌套分析、重复逻辑精简建议与部署待核实项。跨端属于同一根因的问题合并在原编号下，不把后端缺过滤和前端 v-html 分别重复计数。优先级含义：

| 优先级 | 含义 |
| --- | --- |
| P1 | 尽快修复：权限、隐私、危险内容处理，或能够阻断正常业务的问题 |
| P2 | 随后修复：数据一致性、故障处理、资源占用或功能边界问题 |

问题来自静态调用链审查；其中 R06、R08、R17、R18、R27、R28、R29、R32 还经过本地运行检查。前端模拟检查直接读取现有源函数，替换网络、路由或生命周期宿主，不等同于真实浏览器端到端测试。未进行线上攻击验证，不将有条件的风险描述为已经发生的事故。

| 编号 | 优先级 | 问题 | 最小处理方向 |
| --- | --- | --- | --- |
| R01 | P1 | 客户端 visitorId 被当作身份凭据 | 从服务端验证过的访客会话取得身份 |
| R02 | P1 | “悄悄话”正文及邮箱或 QQ 对外返回 | 服务端实现私密可见性，公开响应移除联系方式 |
| R03 | P1 | 非 Markdown 分支原样保存 HTML，邮件也直接拼接用户内容 | 普通文本转义，富文本使用现有清理器 |
| R04 | P1 | 编辑已审核内容后仍保持审核通过 | 编辑后重新审核并同步计数、格式标记 |
| R05 | P1 | 登录和改密日志包含密码、验证码 | 只记录动作、账号标识和结果 |
| R06 | P1 | 改密接受登录不接受的密码 | 统一密码校验规则 |
| R07 | P1 | 开始日期晚于结束日期时循环无法到达终点 | 在共享日期方法拒绝反向区间并限定跨度 |
| R08 | P1 | 图片未转码却改成 WebP 后缀 | 后缀与实际输出格式一致 |
| R09 | P1 | OSS 上传失败仍返回成功 URL | 保留异常语义，仅成功后返回地址 |
| R10 | P2 | 点赞去重与增量更新不是原子操作 | Redis 原子完成成员变更和计数 |
| R11 | P2 | 读取整行后回写导致并发更新互相覆盖 | 计数用原子 SQL，更新只写负责的字段 |
| R12 | P2 | 文章计数回退及多处缓存失效遗漏 | 补齐变更与缓存依赖关系 |
| R13 | P2 | MySQL 成功、Redis 确认失败后会重复同步 | 明确统计精度，按需要做批次去重 |
| R14 | P2 | 同步锁过期后旧任务能删除新任务的锁 | 所有者标识、比较删除与租约处理 |
| R15 | P2 | 过期 Token 占设备名额，签发也缺少独立会话标识 | 清理过期成员并增加 jti |
| R16 | P2 | 验证码发送、消费和冷却状态存在竞态 | 原子领取发送资格、原子消费验证码 |
| R17 | P2 | 异步日志中管理员 ID 丢失 | 在请求线程取值后显式传入 |
| R18 | P2 | 截断序列化 JSON 会使审计记录无效 | 截断字段后再序列化 |
| R19 | P2 | 回复没有验证文章、父节点和根节点关系 | 服务端查询并推导关系 |
| R20 | P2 | 订阅与退订没有邮箱所有权校验，重复订阅也缺约束 | 邮箱确认、退订凭据和唯一约束 |
| R21 | P2 | 限流桶只增不减 | 使用已有缓存能力限制容量和闲置寿命 |
| R22 | P2 | 评论和留言每次查询全部树节点 | 根节点分页，只读取本页回复 |
| R23 | P2 | 粗粒度设备特征会把不同访客合并 | 随机访客标识，特征仅辅助分析 |
| R24 | P2 | 首次网络采样将历史字节量算成瞬时速率 | 首次只建立基线 |
| R25 | P2 | 更新 ID 缺失或目标不存在仍可能返回成功 | 更新入口校验 ID 与实际更新结果 |
| R26 | P2 | RSS URL 未转义，合法输入能破坏 XML | 对完整 URL 做 XML 转义 |
| R27 | P1 | 离开编辑页时保存校验失败仍允许导航 | 保存返回明确结果，成功后才允许离开 |
| R28 | P2 | 新草稿保存后不回填 ID，继续保存仍走创建 | 创建返回 ID，原编辑会话后续更新同一文章 |
| R29 | P2 | 401 跳登录被路由守卫送回后台 | 先清除前端登录状态，再替换登录路由 |
| R30 | P2 | 换邮箱发送验证码依赖不存在的 username | 已登录操作从认证身份发送验证码 |
| R31 | P2 | 算术验证码返回答案且仅在浏览器校验 | 真正需要防自动化时在服务端验证 |
| R32 | P2 | 侧栏卸载主动关连接，反而触发重连 | 区分主动关闭并清理重连计时器 |
| R33 | P2 | 开发环境 WebSocket 绕过代理却保留 /api 前缀 | 统一 WebSocket 地址与代理重写 |
| R34 | P2 | 慢旧请求覆盖新路由或新筛选结果 | 复用请求序号或取消机制，只接受当前结果 |
| R35 | P2 | 访客身份就绪后没有重新加载点赞与订阅状态 | 显式等待或响应访客就绪状态 |
| R36 | P2 | 监控轮询可在卸载后启动，慢请求持续重叠 | 结束后调度下一次，卸载时终止生命周期 |
| R37 | P2 | 无关接口被 Promise.all 捆绑，一项失败清空整页 | 按数据责任独立赋值，保留已经成功的数据 |
| R38 | P2 | 错误提示出口不一致，临时限流也跳整页 | 统一错误归属，区分临时失败与封禁 |

## 2. 审查范围与验证证据

### 2.1 覆盖范围

| 范围 | 文件数量 | 审查内容 |
| --- | ---: | --- |
| DL-common 生产 Java | 50 | 常量、异常、上下文、属性、JSON、JWT、IP、Markdown、图片、OSS、邮件工具 |
| DL-pojo 生产 Java | 102 | 全部 DTO、实体、VO，字段校验、对外返回和数据库映射 |
| DL-server 生产 Java | 154 | 全部 Controller、Service/实现、Mapper、配置、切面、拦截器、任务、WebSocket |
| DL-server 测试 Java | 3 | 图标校验、计数同步、Markdown 渲染测试 |
| 构建与资源 | — | 4 个 POM、6 个 Mapper XML、Lua、日志配置、本地 4 份 YAML、建表脚本及迁移 |

后端共 309 个 Java 文件，约 21,342 行，含注释和空行。补充检查了前端全部 API、Store、路由、组件脚本、模板中的信任边界及构建配置；样式纳入构建检查，没有进行逐屏视觉验收。读取了现有接口文档和图标校验说明以核对约定；没有将已有接口文档重新生成。

| 前端应用 | Vue 文件 | src 内 JavaScript 文件 | 重点 |
| --- | ---: | ---: | --- |
| Frontend-Admin | 27 | 35 | 登录、编辑器、审核、资料、管理列表、图表、轮询 |
| Frontend-Blog | 22 | 26 | 内容展示、评论/留言、点赞、订阅、访客、侧栏、锚点 |
| Frontend-Cv | 4 | 8 | 简历数据、主题、访客记录、路由 |
| Frontend-Home | 4 | 7 | 个人资料、社交链接、站点配置、主题、访客记录 |

共 57 个 Vue 文件和 76 个 src JavaScript 文件；另检查四套 Vite/ESLint/package 配置和 Blog 的测试。前端 src 中 JS、Vue、SCSS/CSS 共约 28,253 行，包含模板、样式、注释和空行，不将大文件行数直接当成业务函数复杂度。

本地 YAML 和完整建表脚本被 Git 忽略；它们能作为本地配置与表结构的证据，不能据此断言生产环境配置和表结构完全相同。没有将其中的凭据值复制到本文。

### 2.2 已执行检查

1. 在项目根目录执行 `mvn -o test`，四个模块构建成功，**33 项测试通过，0 失败、0 错误、0 跳过**。
2. 用现有测试依赖运行四个 JShell 检查，未启动 Spring 应用，未连接真实外部服务：
   - Bean Validation 接受改密值 `Newpass1!`，但拒绝使用同一值登录。
   - 请求线程写入 BaseContext 后，新建异步虚拟线程读取不到管理员 ID。
   - 使用 MockMultipartFile 和模拟 OSS，在关闭压缩时确认原始 PNG 字节被以 `webp` 扩展名上传。
   - 对超过 5,000 字符的 JSON 应用现有截断方式后，Fastjson2 解析失败。
3. 检查已安装 MyBatis-Plus 3.5.7 的分页拦截器实现，确认当前 `maxLimit=500` 会约束负 pageSize。**没有把“负数分页可绕过 500 条上限”列为问题。**

已有的计数同步修改保留了快照之后的新增量，相关 9 个用例通过；本文没有重复报告旧版“同步后删除字段导致丢量”的问题。R13、R14 指的是另两种尚未覆盖的失败路径。

4. 四个前端应用均完成生产构建。使用各应用原 Vite 配置及已安装插件，输出改至后端临时目录，并关闭自动生成类型声明和自动安装图标包以保持前端只读；保留原分包、压缩和源码处理设置。构建通过不代表交互流程正确。
5. 四个应用共检查 137 个 JS/Vue 文件（含 Vite 配置），ESLint **0 错误**。关闭纯格式提示，额外设置控制语句嵌套上限 4、回调嵌套上限 3、复杂度提示阈值 18；仅得到两处复杂度警告，详见第 5 节。没有运行带 `--fix --cache` 的项目 lint 脚本。
6. 执行 Blog 的 `node --test tests/markdownAnchors.test.js`，**4 项全部通过**。
7. 用前端现有源函数和模拟宿主复现五种行为：保存校验失败仍可离页、两次保存新稿都提交空 ID、Ctrl/Cmd+S 将已发布稿提交为未发布、401 跳登录被守卫送回仪表盘、侧栏卸载后仍安排重连。Ctrl/Cmd+S 的行为涉及产品约定，放在第 6 节核实，不直接算成独立缺陷。
8. 使用 JDK 21 自带编译器 AST 解析 306 个后端生产 Java 文件，检查 579 个带方法体的声明（包含构造方法），定位控制语句嵌套和相同方法体，再回查调用方。没有安装分析依赖。

### 2.3 前后端结合后补全的结论

| 原问题 | 前端证据 | 合并后的判断与修改范围 |
| --- | --- | --- |
| R01 访客权限 | 公开 VO 的 visitorId 被 isOwn/isMine 比较；写请求再次提交本地 Store 中的 visitorId | 按钮归属检查只是 UI 判断，服务端必须验证会话，前端 API 和 Store 一并适配 |
| R02 私密与隐私 | 两处复选框显示“悄悄话”，展示模板却不按 isSecret 限制正文；头像函数使用原始 emailOrQq | 实际页面承诺私密，当前没有落实。隐藏字段时应同步处理头像来源，不能先删后端字段再让头像逻辑失效 |
| R03 HTML | Blog 正文/回复、Admin 审核列表和详情直接使用 v-html；Hero 元信息也把分类名等拼成 HTML | 危险内容确实到达渲染点，尤其后台在审核前就展示待审内容；修复需要覆盖存储、历史展示与模板 |
| R06 密码 | 登录页重复相同字符白名单，设置页只要求非空和两次一致 | 仅改后端 DTO 仍不能解决登录被前端挡住的问题，两端同时对齐 |
| R20 订阅 | 侧栏“编辑→保存”仍调用新增订阅接口 | 相同活跃邮箱会被后端拒绝，换邮箱可能产生同访客多条记录，导致状态单条查询失败 |
| R26 RSS | Footer 链接直接提供后端 RSS XML | XML 转义修复在生成端完成，无需前端另包一层 Feed 生成器 |

## 3. 优先修复问题

### R01 · P1 · visitorId 是可伪造参数，不能作为权限依据

**位置：**[评论接口](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/blog/ArticleCommentController.java:72)、[评论编辑](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:342)、[留言编辑](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/MessageServiceImpl.java:316)、[订阅状态](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/RssSubscriptionServiceImpl.java:185)。

评论、留言的修改和删除只比较请求中的 visitorId 与数据库中的 visitorId。公开列表恰好返回该字段，调用者可以先读取目标记录的标识，再把同一标识放进修改或删除请求。读取“当前访客的未审核内容”、点赞/取消点赞、订阅状态也信任外部传入的 visitorId。管理端 JWT 拦截器只覆盖 `/admin/**`，没有保护这些路径。

**建议：**复用现有访客会话建立服务端绑定，或签发不可伪造的随机访客凭据；业务层从已验证会话取 visitorId，不用请求值证明身份。不能把设备指纹或返回的 sessionId 字符串直接当作另一种可信参数。若访客凭据只用于匿名内容归属，无需引入完整用户注册系统。

**影响范围/验收：**三个站点的访客记录入口、评论/留言读写、点赞、订阅检查及调用方参数约定；A、B 两个会话中，B 即使知道 A 的全部数字 ID，也不能读取 A 的待审内容或修改、删除、取消其点赞。旧访客归属需制定迁移方式，不能因缺新凭据自动放行。

### R02 · P1 · “悄悄话”正文和联系方式对外公开

**位置：**[ArticleCommentVO](D:/CodingFiles/Blog/DriftingLeaves/DL-pojo/src/main/java/com/xuan/vo/ArticleCommentVO.java:57)、[MessageVO](D:/CodingFiles/Blog/DriftingLeaves/DL-pojo/src/main/java/com/xuan/vo/MessageVO.java:54)、[评论树转换](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:229)。

公开 VO 包含 emailOrQq，转换时复制实体全部同名字段，没有脱敏。已审核的评论/留言会将原始邮箱或 QQ 返回任意调用者。更关键的是，前端将 isSecret 展示为“悄悄话”，但两类树查询未限制该字段，模板也直接展示内容。用户勾选后，正文一旦通过审核仍会出现在公开响应与页面中。表结构和接口文档却将同字段称为“匿名”，与实际页面承诺冲突。

前端位置：[文章悄悄话选项](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Article/index.vue:706)、[留言悄悄话选项](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Message/index.vue:388)、[公开展示](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Message/index.vue:492)。

管理端游客虽然被限制为 GET，却能读取评论联系方式、订阅邮箱和待审内容；当前仅访客/浏览列表做了 IP 遮蔽，监控另有管理员检查。是否允许演示游客读取这些资料需要统一权限规则。

**建议：**按当前“悄悄话”的用户承诺，在服务端限制正文仅对已验证作者和管理员可见，并统一文档含义；若产品实际只需匿名，必须先修改页面说明，不能继续声称私密。公开响应移除联系方式。管理端个人信息、订阅和内容审核相关读取按明确的数据权限放行。通知服务保留内部联系方式，不必删除业务所需数据。前端头像依赖原始 emailOrQq，应改为服务端提供的受控头像信息或默认头像。

**影响范围/验收：**公开 VO、转换方法、管理端相关 GET 入口和前端字段依赖；检查实际 JSON，确保没有靠 CSS 隐藏的原始联系方式，演示游客也不能下载完整通讯录。

### R03 · P1 · 非 Markdown 内容和邮件缺少输出过滤

**位置：**[评论提交](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:289)、[留言提交](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/MessageServiceImpl.java:78)、[邮件模板](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/utils/EmailTemplateUtil.java:138)。

Markdown 分支使用了带清理的 MarkdownUtil；非 Markdown 分支直接把 content 赋给 contentHtml，编辑和管理员回复也重复了这个分支。用户输入的事件属性等危险内容可以原样进入数据库与 API。前端已确认直接用 v-html 展示这些字段，没有调用清理器；Admin 审核列表甚至在审核通过前就渲染待审内容。已确认输入到危险渲染点的完整代码链路，未在真实浏览器执行攻击载荷。

前端位置：[评论审核列表](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Comment/index.vue:221)、[留言审核列表](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Message/index.vue:198)、[博客评论](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Article/index.vue:812)。另外，[HeroBanner](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/HeroBanner.vue:44) 以 v-html 展示元信息，而文章页直接插入分类名、分类页直接插入分类描述；这类本可使用文本插值的数据，应取消手工拼 HTML。

回复邮件直接将昵称、原文和回复拼接进 HTML。即使 Markdown 分支生成了安全 contentHtml，通知传入的仍是原始 content，邮件内容注入不受该清理保护。这里能够确认的是 HTML 内容注入，不能据此宣称所有邮件客户端都会执行脚本。

**建议：**普通文本先 HTML 转义并按产品需求处理换行；如果该分支实际支持 HTML，就统一使用已有 MarkdownUtil.sanitize。邮件中的普通文本、昵称和属性值按各自输出位置转义，避免另建过滤框架。

**影响范围/验收：**评论与留言的提交、编辑、回复，邮件模板和已存数据展示；覆盖 `<img onerror=...>`、引号、`&`、普通换行、Markdown，并确认所有分支都无法带出危险属性。历史内容需安全展示或一次性清理。

### R04 · P1 · 编辑已审核内容可以绕过再次审核

**位置：**[editComment](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:342)、[editMessage](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/MessageServiceImpl.java:316)。

编辑只更新 content 和 contentHtml，没有把 isApproved 改回待审，也没有保存新的 isMarkdown、设置 isEdited。用户先提交正常内容获批，之后可换成未审核内容立即公开。切换编辑格式后，存储的格式标识也与正文不一致。

**建议：**编辑内容后重新待审，保存格式与编辑标记；评论由已审核变为待审时同步调整文章评论数和缓存。身份修复 R01 后仍需要修复这一条。

**影响范围/验收：**两类编辑方法、评论计数及审核列表；“已通过→编辑→待审→重新通过”完整一轮只增减一次，编辑 Markdown 开关后再次读取的格式正确。

### R05 · P1 · 日志记录了明文密码和验证码

**位置：**[登录日志](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/admin/AdminController.java:69)、[改密日志](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/admin/AdminController.java:111)。

Controller 把 AdminLoginDTO 和 AdminChangePasswordDTO 整体写入 info 日志；Lombok 的 Data 会生成包含 password、oldPassword、newPassword、confirmNewPassword、code 的 toString。换邮箱也整体记录包含验证码的 DTO。当前本地配置的 Controller 日志级别为 info，生产日志文件还会保留历史。

**建议：**删除整对象记录，保留操作、账号标识、结果等必要字段；不要再加一个正则日志清洗层补救。对于审计数据，SaveLogAsyncServiceImpl 目前只检查参数名和 Map 第一层，不能据此认为嵌套 DTO 已完成脱敏。

**影响范围/验收：**所有密码、验证码、Token 相关日志调用，以及运维日志保留方式；用哨兵值走登录、改密、换邮箱，确认控制台、文件、审计数据均不出现哨兵。已有日志若确实含有效凭据，应限制访问并清理，必要时更换对应凭据。

### R06 · P1 · 改密接口接受登录接口拒绝的密码

**位置：**[AdminLoginDTO](D:/CodingFiles/Blog/DriftingLeaves/DL-pojo/src/main/java/com/xuan/dto/AdminLoginDTO.java:35)、[AdminChangePasswordDTO](D:/CodingFiles/Blog/DriftingLeaves/DL-pojo/src/main/java/com/xuan/dto/AdminChangePasswordDTO.java:30)。

登录只接受字母、数字和下划线，改密只检查非空和 6–32 位长度。`Newpass1!` 能通过改密校验，保存后该密码却被登录入口拒绝；改密还会注销所有设备，因此用户会立即失去登录入口。已用真实 Bean Validation 复现校验差异。

**建议：**优先去掉登录接口不必要的密码字符白名单，使两端接受相同密码范围；保留用户名校验和密码长度边界。同步调用方提示，不要只在前端限制字符。

**影响范围/验收：**登录、改密 DTO 和界面提示；前端[登录规则](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Login/index.vue:27)也有相同白名单，[设置页](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Settings/index.vue:123)则没有，需要同步调整。对字母数字、下划线、符号、长度边界执行“改密成功→重新登录成功”，保证已保存的合法密码能使用。

### R07 · P1 · 反向日期区间会持续扩张列表

**位置：**[ReportServiceImpl.getDateList](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ReportServiceImpl.java:198)。

循环条件是 begin 不等于 end，循环体只把 begin 加一天。传入 `begin=2026-10-26,end=2026-10-25` 后无法到达终点，会持续分配日期对象和列表空间，直至资源耗尽或日期溢出。两个统计接口共用此方法，游客账号也允许 GET 查询。

**建议：**在共享入口拒绝空值、begin>end，并按已有报表用途限定最大跨度；这不需要新的日期抽象。

**影响范围/验收：**浏览统计、访客统计、错误响应；反向区间立即返回明确参数错误，同日返回一天，普通跨月区间正确，超大区间被拒绝。

### R08 · P1 · 图片未转码也会被重命名成 WebP

**位置：**[CommonServiceImpl](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/CommonServiceImpl.java:49)、[ImageCompressUtil](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/utils/ImageCompressUtil.java:40)。

压缩器在关闭压缩、文件较小、格式不支持时返回原字节；调用方只要认为是图片，就无条件把扩展名改成配置的 output-format。默认配置下，小 PNG/JPEG，乃至 SVG/ICO，都可能成为“内容不是 WebP、文件名却是 WebP”的对象。已用关闭压缩的 PNG 复现原字节与上传扩展名不符。

**建议：**明确区分“是否转换格式”与“是否需要减小体积”，未转码保留后缀，确实转码后使用目标后缀。文件扩展名先按统一大小写处理，并校验缺文件、缺文件名等输入。上传需要保留的 SVG/ICO 不应只改名。

**影响范围/验收：**上传服务和图片工具；覆盖小图、大图、关闭压缩、SVG/ICO、大写扩展名，检查实际文件签名与后缀一致。现有压缩强制 RGB，若头像需要透明度，还要覆盖透明 PNG 的结果。

### R09 · P1 · 上传失败却返回成功 URL

**位置：**[AliOssUtil.upload](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/utils/AliOssUtil.java:39)。

OSSException 和 ClientException 被打印后吞掉，随后照常拼接 URL 并返回。Controller 因此发送成功响应，用户可能把根本不存在的对象地址保存到文章、音乐或个人资料。

**建议：**在工具层保留失败语义，向上传服务抛出异常，由现有业务异常机制返回失败；只在 putObject 成功后返回 URL，保留 finally 资源关闭。日志使用项目日志体系，不打印凭据。

**影响范围/验收：**OSS 工具、CommonServiceImpl、上传 Controller；模拟拒绝、网络失败和成功，前两者绝不返回成功地址，客户端均被正确关闭。

## 4. 一致性、可靠性与资源问题

### R10 · P2 · 点赞成员去重与计数更新不原子

**位置：**[ArticleLikeServiceImpl](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleLikeServiceImpl.java:31)。

两个请求可同时读到没有点赞记录，再各执行添加与计数 +1，最终只有一个成员却增加两次。取消点赞同理可重复 -1；在成员修改成功、计数写入失败时，两者也会分离。

**建议：**在一个 Redis Lua 操作内依据 ZADD NX/ZREM 的实际变更结果决定是否修改增量。不仅是在 Java 中根据返回值再发一次命令；那样只能减少重复，不能覆盖命令之间的故障。除非时间排序确有消费者，不必为去重额外保留 ZSet 排序能力。

**影响范围/验收：**点赞服务与同步测试；并发同一访客点赞只 +1、重复取消只 -1，交错点赞/取消后成员状态与累计增量一致。

### R11 · P2 · 整行回写会覆盖其他请求刚更新的字段

**位置：**[访客缓存回写](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/VisitorServiceImpl.java:284)、[评论计数](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:438)、[文章编辑](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleServiceImpl.java:182)。

访客命中缓存后用缓存里的 totalViews+1 回写整条实体；并发请求读到相同值会丢失计数，缓存里旧的地理位置等字段还会覆盖异步更新。评论计数先查询 Articles，再 +1/-1 后 updateById，既可能丢增量，也可能把同时同步的浏览量/点赞量写回旧值。编辑文章同样会把查询到的旧计数字段带回数据库。

**建议：**计数使用数据库原子增减，写操作仅指定自己负责的字段；审核采用条件状态迁移，只有从未通过成功改为通过的记录才计数，避免并发重复审核。根评论批量删除时按文章汇总数量后一次扣减，替代每条子评论都先查文章再更新的循环。

**影响范围/验收：**访客三种更新分支、异步地理更新、评论审核/删除/管理员回复、文章编辑；并发两次访问最终 +2，编辑与同步交错不丢统计，不同评论同时审核都能计入，同一评论重复审核只计一次。

### R12 · P2 · 缓存失效不完整，计数同步后页面会回退

**位置：**[文章缓存](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleServiceImpl.java:350)、[合并待同步计数](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/blog/ArticleController.java:142)、[同步任务](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/task/ViewCountSyncTask.java:59)。

例如列表缓存基数为 100，Redis 增量为 5，页面显示 105。同步后数据库为 105、Redis 增量为 0，列表缓存仍是 100，页面退回 100，直至缓存失效。详情、分类列表也有同样问题；标签列表没有合并增量，读取口径又不同。

还存在以下确定的缓存依赖遗漏：

| 变更 | 当前遗漏的缓存/数据依赖 |
| --- | --- |
| 文章新增、删除、发布、取消发布 | 分类和标签的 articleCount，RSS、sitemap |
| 分类改名 | articleDetail 内 categoryName、热门榜中的分类名 |
| 标签改名或删除关联 | articleDetail 的标签名、按标签缓存的文章列表 |
| 评论审核、删除、管理员回复 | 文章详情、列表和热门文章里的 commentCount |
| 个人资料变更 | RSS 站点名称与简介 |

**建议：**先补齐上述实际依赖，在成功落库/提交后失效。对带计数的长寿命文章缓存，最直接的修复是缩小或取消该缓存范围；若暂保留，就至少同步失效相关缓存。后者能修复长时间回退，但 MySQL 已更新、Redis 未扣减的短窗口仍可能双计，不能宣称强一致。不要为单个博客直接增加多级缓存框架。

**影响范围/验收：**文章/分类/标签/评论/个人资料写入、两类同步任务、RSS 和 sitemap；先预热缓存，再执行变更读取，验证计数不持续回退、取消发布后 RSS/sitemap 不再保留旧文章。失效动作需与事务提交时机配合。

### R13 · P2 · 跨存储确认失败会造成计数重复同步

**位置：**[点赞同步](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/task/LikeCountSyncTask.java:55)、[浏览同步](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/task/ViewCountSyncTask.java:59)。

当前先更新 MySQL，再扣 Redis 增量。如果数据库已经成功，但扣减超时、失败或进程退出，增量仍留在 Redis；下轮会再次加到数据库。已有测试覆盖“数据库失败则不扣减”，没有覆盖“数据库成功、确认失败”。反过来先扣 Redis 会把重复变成丢失，不能直接调换顺序。

**建议：**先明确浏览/点赞统计是否允许近似。若允许，应明确该故障边界并提供对账方式；若要求重试不重计，为同步批次加唯一标识，并在同一 MySQL 事务中完成去重与计数更新，再确认 Redis。可使用现有 MySQL/Redis，不必先引入消息队列。

**影响范围/验收：**两个任务、Mapper、必要的批次表迁移；故障注入到“数据库提交后、Redis 扣减前”，重试同一批次不重复累计。R10 的成员原子更新不能替代这一检查。

### R14 · P2 · 分布式锁缺少所有者校验和超时后处理

**位置：**[点赞任务加锁](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/task/LikeCountSyncTask.java:31)、[释放锁](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/task/LikeCountSyncTask.java:70)、[浏览任务释放锁](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/task/ViewCountSyncTask.java:77)。

锁值固定为 1，四分钟过期，finally 无条件删除。若旧实例任务超过租期，新实例可拿到锁；旧实例完成后会删除新锁，而且两个任务在租期结束后可能同步同一份快照。代码注释明确承诺多实例互斥，这不是为尚不存在的能力额外扩展。

**建议：**每次加锁使用独立标识，以 Lua 比较所有者再删除；同时处理任务超过租约的问题，例如受控续租或能够安全重复的批次机制。仅比较删除不能恢复已经失去的互斥，仅延长 TTL 也不能证明任务一定按时完成。

**影响范围/验收：**两个同步任务及锁测试；模拟 A 过期、B 接管后 A 结束，B 的锁仍存在，且同一同步批次不重复落库。

### R15 · P2 · Token 生命周期与设备名额不匹配

**位置：**[token_add.lua](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/resources/lua/token_add.lua:19)、[TokenServiceImpl](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/TokenServiceImpl.java:68)、[JwtUtil](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/utils/JwtUtil.java:38)。

Redis Set 只有整个集合的 TTL，新登录不断延长集合寿命，JWT 已过期的成员却不会单独移除。累计十个成员后，即使其中大部分 JWT 已失效，也会拒绝新登录；活跃的新成员又可能让旧成员继续占位。

签发内容没有 jti 或其他独立会话标识。同一用户、相同角色、落在相同 JWT 过期时间精度的签发可能产生相同 Token，导致两个登录共享成员，单端登出会同时失效。该项为签发路径分析，未做高频签发实验。

**建议：**为每次登录增加随机 jti；设备集合按成员到期时间清理后再计算名额。可用带过期分数的 ZSet 在已有 Lua 中清理、计数和添加，登出/验证也需一起适配，避免只改单个脚本。

**影响范围/验收：**JWT 创建、Lua、成员验证、单端与全端登出、旧 Token 迁移；过期成员不占名额，同秒两次登录拥有独立凭据，登出一个不影响另一个。

### R16 · P2 · 验证码的发送资格、一次性消费和冷却互相脱节

**位置：**[发送入口](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/AdminServiceImpl.java:71)、[验证码状态](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/VerifyCodeServiceImpl.java:50)、[消费与清理](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/VerifyCodeServiceImpl.java:148)。

canSendCode 与 saveCode 分开，多个并发请求能一起通过检查、覆盖验证码并发送多封邮件。verifyCode 先 GET 再比较和删除，并发请求可能都验证成功。成功时 clearAll 连发送冷却也删除；重新发送又会清除锁定与失败次数，当前发送入口未检查验证码锁定。使用普通 Random 生成安全验证码也不合适，应使用 SecureRandom。

另外，验证码不存在时首次错误计数可能没有 TTL：只有 codeTtl>0 才设置过期，留下没有自然清理期限的计数键。

**建议：**用原子操作领取冷却资格，成功消费验证码也原子完成；发送冷却、验证码消费和锁定使用清晰的独立生命周期。邮件失败时仅清理属于本次发送的状态，不能误删并发新验证码。共享 SecureRandom 即可，不需要验证码框架。

**影响范围/验收：**发送、登录、换邮箱三个调用方；并发发送只领取一次资格，同一验证码只能消费一次，发送失败可按规则重试，成功登录不提前取消发送冷却，无验证码的错误计数也有 TTL。

### R17 · P2 · 异步审计日志读取不到请求线程的管理员 ID

**位置：**[OperationLogAspect](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/aspect/OperationLogAspect.java:59)、[SaveLogAsyncServiceImpl](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/SaveLogAsyncServiceImpl.java:133)、[BaseContext](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/context/BaseContext.java:5)。

saveLogAsync 在另一个虚拟线程中执行，再读取普通 ThreadLocal。这个值没有传播，导致审计记录缺少操作者。已用当前 BaseContext 和虚拟线程执行器验证；这与请求结束后是否清理上下文无关。

**建议：**切面在请求线程读取 adminId，作为普通参数传给异步服务。无需改成全局可继承 ThreadLocal，也无需为了一个标量增加通用上下文传播组件。

**影响范围/验收：**切面、异步接口与实现；开启真实异步代理验证日志 adminId 正确，请求已经结束也不丢失；不同管理员并发操作不会串用身份。

### R18 · P2 · 审计数据截断后不是有效 JSON

**位置：**[截断代码](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/SaveLogAsyncServiceImpl.java:148)、[本地审计表结构](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/resources/sql/DriftingLeaves.sql:31)。

buildOperateData 返回 JSON 字符串，超过 5,000 字符后直接 substring 再加省略号，几乎必然破坏 JSON。当前本地表的 operate_data 类型为 JSON，按该表结构落库会失败；即使生产改成文本，该字段也不再可作为 JSON 使用。文章创建和编辑的正文很容易超过这个阈值，异常随后仅写日志，审计记录缺失。已用 Fastjson2 复现截断数据解析失败。

**建议：**在对象字段层截断正文等大字段，或审计只保留标题、ID、变更字段摘要，再统一序列化。脱敏也应发生在这一受控数据层，避免依赖参数名猜测 DTO 内容。

**影响范围/验收：**审计构建、文章等大参数调用方；超过 5,000 字符的正文也产生可解析 JSON，按实际数据库 JSON 列保存成功，敏感字段不进入审计。

### R19 · P2 · 回复关系与目标文章由客户端自行指定

**位置：**[评论提交](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:277)、[留言提交](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/MessageServiceImpl.java:66)。

articleId、rootId、parentId、parentNickname 直接复制到实体，没有核实文章是否存在且已发布，也没有检查父评论是否属于该文章、根节点是否对应父节点。当前本地表没有这些关系的外键兜底。结果包括跨文章回复、挂不到树上的孤儿节点、把非根节点当根节点，以及通过任意父节点触发邮件通知。

**建议：**服务端查父节点，推导根节点和父昵称，验证文章归属与发布状态；管理员回复与访客回复复用同一关系规则。创建文章的分类和标签关联也应在写入前验证存在性。

**影响范围/验收：**两类提交、管理员回复、关联表写入；拒绝不存在的文章、跨文章父节点和不一致的根节点；合法的多级回复仍挂到正确根节点。文章删除时同步清理评论、点赞及对应 Redis 数据，避免留下孤儿记录。

### R20 · P2 · 订阅和退订未验证邮箱所有权，重复记录会破坏单条查询

**位置：**[RSS 公开入口](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/blog/RssSubscriptionController.java:45)、[订阅实现](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/RssSubscriptionServiceImpl.java:37)、[订阅状态查询](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/RssSubscriptionServiceImpl.java:195)。

知道邮箱即可替别人订阅或退订；没有确认邮件或退订凭据。查询状态只凭 visitorId 返回邮箱，属于 R01 的身份问题。另有独立的数据完整性问题：添加按邮箱查后再插入，但本地 schema 的 email 仅普通索引，并发可插入重复邮箱；一个 visitorId 也可订阅多个邮箱，而状态查询调用 one，会在多条时失败。旧记录重新激活时还没有更新 visitorId，可能继续归属于旧访客。

**建议：**邮箱订阅先确认所有权，退订使用绑定订阅记录的不可猜测凭据。按产品现有规则明确“每访客一份订阅”或“允许多份”：前者用唯一约束和更新已有记录，后者返回列表。邮箱唯一性在数据库约束，补约束前先处理已有重复；重新绑定需跟随验证后的身份。

前端还有确定的接口语义不匹配：[侧栏订阅编辑](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/SidebarCard.vue:46)在编辑模式仍调用 addSubscription。编辑同一活跃邮箱会返回“已订阅”，换邮箱则可能新建另一条记录。修复应让编辑操作更新已验证的订阅，不能只改成功提示。

**影响范围/验收：**订阅、编辑、退订、状态查询、邮件模板、表结构和旧数据；第三方不能只凭邮箱退订，同邮箱并发不会重复，一个访客多次操作不会使状态查询 500；原邮箱编辑昵称与经过验证的换邮箱均符合最终产品规则。

### R21 · P2 · 本地限流桶永不淘汰

**位置：**[RateLimitConfiguration](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/config/RateLimitConfiguration.java:24)。

ConcurrentHashMap 为每个 IP/接口组合保留 Bucket，没有过期或容量上限。长时间运行后历史访问者一直占内存；这与桶中令牌是否已补满无关。

**建议：**使用项目已有 Caffeine 能力，设置闲置过期和合理容量。过期时间需至少覆盖桶恢复到满容量所需的窗口，避免通过淘汰重置限流。现有 Bucket4j 核心限流逻辑可以保留。

**影响范围/验收：**桶存储与限流配置；大量不同 key 后容量受限，闲置桶能回收，活跃桶和正常补充令牌规则不变。多实例限流目前各自计数，应在部署说明中明确，除非已有统一限流要求，否则无需直接改造成分布式系统。

### R22 · P2 · 评论树和留言树无分页

**位置：**[评论树查询](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/ArticleCommentServiceImpl.java:229)、[留言树查询](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/MessageServiceImpl.java:266)。

每次读取全部符合条件的节点、构造对象和树，再整体返回。留言板尤其会随全站历史增长，分页拦截器的 500 条上限不作用于这些 list 查询。当前写入限流不能限制历史数据的累计量。

**建议：**根节点分页，按本页 rootId 批量查询回复；若单根回复特别多，再为该根增加回复分页，不要预先实现通用树存储框架。

**影响范围/验收：**公开接口响应与前端加载方式、对应索引；多页根节点不丢回复、不重复节点，待审内容仍只属于已验证访客，不能简单对全部节点 LIMIT 后截断树。

### R23 · P2 · 设备指纹会确定性地合并不同访客

**位置：**[FingerprintServiceImpl](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/FingerprintServiceImpl.java:43)、[访客查找](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/VisitorServiceImpl.java:280)。

指纹只取操作系统、语言、时区、宽度分组、CPU/内存和浏览器类型，没有浏览器随机标识。两位常见配置一致的用户输入完全相同，必然生成相同指纹并共用数据库访客记录。这是输入特征相同，不是需要破解 MD5。影响 UV 统计、归属和基于指纹的封禁；一个人的封禁可能影响另一个人。

**建议：**以服务端接受并绑定的随机访客标识做浏览器身份，现有设备特征只辅助统计；与 R01 合并实施即可。保留旧指纹仅用于历史归并分析，不应继续证明所有权。另外 simplifyPlatform 应先判断 Android 再判断 Linux，否则带 Linux 的 Android 平台值会被先归类为 Linux。

**影响范围/验收：**访客创建/查找、唯一索引、封禁与 R01 会话绑定；相同设备参数的两个浏览器存储环境仍获得不同访客，同一浏览器后续请求保持身份，清空 Cookie 后的行为有明确约定。

### R24 · P2 · 首次网络采样制造巨大速率尖峰

**位置：**[collectNetworkSnapshot](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/monitor/ServerMonitorUtil.java:364)、[calculateRate](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/monitor/ServerMonitorUtil.java:695)。

没有 previous 时，当前代码用 0 作历史字节数、用 now 作历史时间；calculateRate 把时间差钳制为 1ms，因此把网卡启动以来的累计字节量乘 1,000 当成每秒速率。初始化采样即会把这个值写入 current 和趋势列表。磁盘 IO 已有 previous==null 返回零的正确模式。

**建议：**网络首帧同样只记录基线并返回零或明确的未就绪值，复用磁盘 IO 的处理方式，不动查询与采样分离的现有设计。

**影响范围/验收：**全部网卡和单网卡采样、初始化趋势；非零历史累计量的首帧不产生速率尖峰，后一帧按真实间隔计算，计数器重置仍不出现负速率。

### R25 · P2 · 更新缺少目标校验，失败可能伪装成成功

**位置：**[SkillServiceImpl.updateSkill](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/SkillServiceImpl.java:68)、[MusicServiceImpl.updateMusic](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/MusicServiceImpl.java:73)、[SystemConfigServiceImpl.updateConfig](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/SystemConfigServiceImpl.java:88)。

多处新增/更新共用 DTO，id 没有针对更新的非空约束；服务直接 updateById 并忽略返回值，Controller 总是 Result.success。目标不存在时，用户看到保存成功，实际上没有任何记录更新。经历、友链、社交、标签等更新也存在相同模式。个人资料读取固定 id=1，更新却接受任意传入 ID，约定也不一致。

**建议：**更新入口校验必须有合法 ID，并确认目标存在或检查更新结果；新增时不要接受外部指定的自增 ID。单例个人资料在服务端固定目标。无需为每个 CRUD 再建通用基类，可使用已有的异常与校验分组，或在现有方法直接处理。

**影响范围/验收：**上述各 CRUD 的新增/更新 Controller 和 Service；缺 ID、未知 ID 返回明确失败，合法更新确实落库，新增接口不能覆盖客户端指定主键的业务语义。

### R26 · P2 · RSS URL 拼接没有 XML 转义

**位置：**[RssFeedServiceImpl](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/RssFeedServiceImpl.java:58)、[ArticleDTO](D:/CodingFiles/Blog/DriftingLeaves/DL-pojo/src/main/java/com/xuan/dto/ArticleDTO.java:33)。

title、summary 使用 escapeXml，文章 link/guid 却直接附加 slug。slug 当前只有非空和长度限制，`a&b` 能通过校验，生成的 XML 中裸 `&` 会使 RSS 无法解析。站点 URL 的文本与 atom:link 属性也未经转义。

**建议：**对拼接后的完整 URL 使用已有 escapeXml，属性中的引号也需转义。若进一步约束 slug，要先兼容已有 URL，不能无迁移直接拒绝历史标识。

**影响范围/验收：**RSS 生成、slug 输入约定；普通 slug、中文、`&`、引号均经过标准 XML 解析器验证，同时 URL 路径编码与 XML 转义各自正确。

### R27 · P1 · 保存校验失败后，离页守卫仍然放行

**位置：**[handleSave](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Article/ArticleEdit.vue:235)、[离页守卫](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Article/ArticleEdit.vue:297)。

用户有未保存内容，离页时选择“保存草稿”；如果缺标题、Slug、分类或正文，handleSave 只提示后正常返回，没有表示保存失败。守卫 await 结束后直接 return true，页面离开，未保存内容丢失。若另一次保存尚在执行，saving 分支直接返回，也会被误当成已经保存。已通过现有源函数和模拟路由钩子复现“校验失败、写入零次、导航获准”。

**建议：**保存函数明确返回成功/失败或抛出失败；守卫只在保存成功时放行，并等待已经在进行的保存。用户明确选择“不保存”仍应能离开，不把这一正常选择改成强制保存。

**影响范围/验收：**编辑器保存、快捷键、离页守卫；缺任一必填字段选择保存时留在页面，网络失败留在页面，保存成功才离开，明确不保存则丢弃并离开。浏览器刷新/关标签页是否提醒另按产品要求决定，不借此增加自动保存系统。

### R28 · P2 · 新草稿保存后没有取得 ID，后续保存仍走新增

**位置：**[编辑器保存](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Article/ArticleEdit.vue:249)、[Store 分流](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/stores/modules/article.js:55)、[创建接口](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/admin/ArticleController.java:57)。

新稿保存草稿后不离开编辑器；后端创建仅返回成功，不返回新 ID，前端也不更新 form.id 或路由。第二次保存/发布时 Store 仍按空 ID 调用创建，同一 Slug 通常被唯一约束拒绝；修改 Slug 则可能新建第二篇。已复现两次保存都提交空 ID。

**建议：**创建接口返回文章 ID，Store 传回结果，首次成功后回填 ID 并更新编辑路由或等价编辑状态；后续保存更新同一篇。不要用“保存后按标题搜索”猜 ID。

**影响范围/验收：**后端创建响应、前端 API/Store/编辑器；连续保存三次再发布，始终只有同一条文章记录，路由切换不触发再次创建；失败时保留编辑内容。

### R29 · P2 · 登录失效跳转与路由守卫互相抵消

**位置：**[401 处理](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/utils/request.js:36)、[路由守卫](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/router/index.js:137)、[用户状态](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/stores/modules/user.js:21)。

运行中 Cookie 失效后，拦截器 push('/login')，但没有清理 Pinia 的 isLoggedIn。守卫看到“已登录访问登录页”又重定向仪表盘，用户仍留在无有效凭据的后台，可能再次触发 401。两秒的跳转标记只抑制重复提示，无法修正身份状态。已用两个真实源函数配合模拟路由复现。

**建议：**在统一的会话失效动作中清除用户信息与登录状态，再 replace 到登录页，避免刷新页面作为恢复手段。不要让路由模块和请求模块为了互相调用再增加循环依赖。

**影响范围/验收：**请求拦截器、用户 Store、路由守卫；并发多个 401 只提示和跳转一次，最终停在登录页，重新登录可恢复。启动时的 silent 请求保留现有静默语义。

### R30 · P2 · 换邮箱的发送验证码请求拿不到 username

**位置：**[设置页发送](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Settings/index.vue:166)、[用户信息读取](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/stores/modules/user.js:49)、[AdminVO](D:/CodingFiles/Blog/DriftingLeaves/DL-pojo/src/main/java/com/xuan/vo/AdminVO.java:20)。

设置页使用 userInfo.username 发送验证码，但登录只暂存 ID，随后 profile 响应仅提供 ID、昵称和邮箱，未提供 username。因此正常登录后的请求发送空用户名，被 SendCodeDTO 拒绝，换邮箱流程无法完成。该函数还动态导入已经在文件顶部静态导入的 useUserStore，属于多余的调用层。

**建议：**已登录的敏感操作由后端从认证上下文识别管理员，发送操作对应的验证码；若复用当前发送接口，至少先把 username 的来源契约补齐，刷新页面后也要可用。已有静态导入直接使用。

**影响范围/验收：**设置页、账户信息契约、验证码入口；新登录和刷新后的设置页均可发送到当前已绑定邮箱，不能相信客户端传入任意管理员 ID。若验证目的包括新邮箱归属，应另明确验证新邮箱的步骤。

### R31 · P2 · 算术验证码没有服务端验证能力

**位置：**[答案校验](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/utils/formValidate.js:81)、[评论提交参数](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Article/index.vue:255)、[验证码接口](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/blog/CommonController.java:28)。

接口把正确 result 返回浏览器；提交评论/留言不传 captchaId 或答案，后端 DTO 也没有相应校验。直接调用提交接口可完全跳过算术题。前端 parseInt 还会把“正确数字后跟其他字符”当作相同答案，但修这个解析细节也不能建立服务端验证。

**建议：**先确认是否确有防自动化需求。需要时在服务端保存有寿命的一次性挑战并验证提交，前端只接题目和挑战 ID；不需要时删除这个没有保护效果的交互，保留有效限流。不要把返回答案改成隐藏字段后声称问题解决。

**影响范围/验收：**生成 API、VO、评论/留言 DTO 和提交服务；绕过页面提交时仍必须满足最终选定规则，错误、过期和重复使用均有定义。与管理员邮件验证码 R16 分属不同链路。

### R32 · P2 · 卸载侧栏会重新建立 WebSocket

**位置：**[关闭回调](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/SidebarCard.vue:125)、[卸载清理](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/SidebarCard.vue:143)。

onUnmounted 调用 close，onclose 不区分主动关闭，五秒后再次 connectWs；重连计时器没有保存和取消。侧栏在多个路由中重新挂载，离开的组件可能持续重连、发送心跳并增加在线连接数。已用现有组件脚本和模拟 WebSocket 生命周期复现。

**建议：**记录组件是否仍活跃，卸载先关闭重连资格并取消已有计时器，再关闭连接。若在线数是整个站点布局的能力，可把一条连接提升到现有布局生命周期管理，无需每个侧栏各自连接。

**影响范围/验收：**侧栏、布局及在线数；多次切换有侧栏的页面，离开后没有旧组件重连，活动连接数不随路由次数增加，真正的意外断线仍按规则重连。

### R33 · P2 · 开发 WebSocket 路径没有对应后端端点

**位置：**[开发连接地址](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/SidebarCard.vue:112)、[Vite 代理](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/vite.config.js:55)、[后端端点](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/websocket/OnlineCount.java:24)。

DEV 时直接连接 localhost:5922，却使用 `/api/ws/online`；后端端点是 `/ws/online`。直接访问后端不会经过 Vite 的 `/api` 重写，当前代理也未配置 WebSocket 转发。生产路径可能由 Nginx 重写，不能用这一开发问题推断生产必然故障。

**建议：**开发直连时使用后端真实端点，或统一连接当前开发主机并配置 ws 转发与前缀重写，选择一种即可。

**影响范围/验收：**侧栏连接地址与 Blog Vite 配置；本地开发完成 101 握手、收到在线数和 pong，生产沿用已验证的代理约定。

### R34 · P2 · 旧请求可以覆盖当前路由或筛选结果

**位置：**[文章加载](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Article/index.vue:125)、[首页搜索](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Home/index.vue:26)、[热门切换](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Hot/index.vue:22)。

这些读取操作没有取消、请求序号或响应与当前参数比对。快速由 A 切 B 时，B 先返回、A 后返回就会把 B 页面内容覆盖成 A，文章标题、Hero、评论和点赞状态也可能错位。后台多个分页 Store 存在相同的“最后返回者覆盖”模式，loading 也可能被旧请求提前结束。

**建议：**参考项目监控页已有 requestToken 模式，只接受当前请求结果，或使用 Axios 已支持的取消能力；选择一种并在真正有并发切换的路径复用。不是给所有单次读取都增加重试/版本框架。

**影响范围/验收：**文章切换、搜索/分类/标签/热门筛选及后台可重入列表读取；人工延迟旧请求并先返回新请求，界面始终显示当前参数的数据，旧点赞操作完成不修改新文章的显示计数。

### R35 · P2 · 访客身份就绪后，依赖状态不会重载

**位置：**[布局初始化](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Layout/index.vue:40)、[点赞检查](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Article/index.vue:182)、[订阅检查](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/SidebarCard.vue:24)。

布局在 mounted 中异步 record，子页面/侧栏也在各自 mounted 中读取 visitorId；ID 暂为空时点赞和订阅检查直接 return，之后没有 watch 或共享的就绪 Promise 再触发。新访客或身份刷新较慢时，依赖状态可一直保持默认值；评论读取也可能缺少本人待审内容。Store 的 record 失败只打印日志，提交界面缺少对应的未就绪状态。

**建议：**把访客记录的就绪结果作为明确依赖，读写入口等待同一次初始化，或在经过验证的身份变化后重载；失败时显示可重试状态。与 R01 一起使用可信凭据，不能为了就绪速度继续信任旧本地数字 ID。

**影响范围/验收：**访客 Store、布局、点赞、评论/留言、RSS；清空存储且延迟 record 响应，身份就绪后状态自动正确，未就绪时不发送必填 ID 为空的写请求。

### R36 · P2 · 监控轮询生命周期和并发控制不完整

**位置：**[轮询](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/ServerMonitor/index.vue:84)、[初始化与卸载](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/ServerMonitor/index.vue:106)。

mounted 先 await 首次请求再 startPolling；若在等待时离开，卸载清理时还没有 timer，请求返回后仍会给已卸载页面启动轮询。固定三秒的 setInterval 也不等前次结束；请求长于三秒时持续叠加，虽然 requestToken 阻止部分旧结果覆盖，却没有阻止请求负载，且最新结果可能反复被后一次请求作废。

**建议：**组件生命周期内，在前一次请求结束后安排下一次，卸载时终止后续调度并取消在途请求或忽略其结果。筛选变化保留 R34 的最新结果约束，失败给出可恢复状态，避免每三秒无界堆积提示。

**影响范围/验收：**监控初始化、筛选、手动刷新、轮询和请求适配；首次请求未结束即离开时不再启动计时器，慢网络下轮询不重叠，初次失败后能按明确规则恢复。

### R37 · P2 · 无关读取被绑在一个全成败事务中

**位置：**[Blog Store.init](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/stores/modules/blog.js:47)、[Home 数据加载](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Home/src/view/Home/index.vue:88)、[CV 数据加载](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Cv/src/view/Home/index.vue:67)。

Blog 将个人信息、统计、分类、标签、音乐放进同一 Promise.all，全部返回后才赋值；音乐失败也会使已成功读取的分类和个人信息被丢弃，分类/标签页可能因此显示没有文章。Home 的可选备案或开始时间配置失败，也会丢弃成功的个人信息与社交数据。CV 的三个独立展示区同样被绑定。

**建议：**保留并行读取，但独立保存各自的成功结果；对必要数据和可选数据分别处理失败。可以使用逐项赋值或 Promise.allSettled，沿用已有 request 和 Store，不新增数据加载框架。BlogFooter 已对独立可选配置使用各自 catch，可作为现有模式参考。

**影响范围/验收：**四站初始化相关读取；让一个可选接口失败，其他成功模块仍能展示；必要接口失败有明确提示与重试，不把后端故障伪装成“没有内容”。

### R38 · P2 · 错误处理的职责和错误类型不一致

**位置：**[Blog 拦截器](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/utils/request.js:12)、[留言提交 catch](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Message/index.vue:166)、[Admin 拦截器](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/utils/request.js:23)。

Blog 业务失败会 reject 普通响应体，网络失败 reject AxiosError；留言页 catch 却写“已由拦截器处理”并不提示，而该拦截器并没有展示业务失败信息。Admin 反过来在拦截器统一提示，部分页面又 catch 并按 e.response.data.msg 取值，可能重复提示且丢失普通响应体中的准确原因。

Blog/CV/Home 把所有 403 都导航至整页错误；后端临时接口限流也抛出 403，和真正封禁无法区分。CV/Home 虽有 Forbidden 组件，路由却没有注册 `/403`，实际会落入 404。临时操作失败不应破坏整页浏览状态。

**建议：**明确一处负责通知，业务响应和传输错误保留可识别的统一读取方式；对静默请求和页面自行处理的错误使用现有 silent 等明确约定。后端给临时限流与封禁提供可区分的状态/错误码，前端只对真正封禁跳页，并注册已有错误页路由。用户取消确认应正常返回，不再抛出假业务错误。

**影响范围/验收：**四个请求封装、表单/列表错误出口、后端限流错误语义与 CV/Home 路由；业务拒绝、网络失败、401、403、临时限流、取消确认各出现一次合适反馈，失败时保留用户输入。

## 5. 重复逻辑、函数嵌套与精简建议

### 5.1 嵌套与分支：检查结果及应当怎么处理

前端检查未发现超过 **4 层控制语句嵌套**或 **3 层回调嵌套**的告警。两处复杂度警告是：[resolveVendorChunk](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/vite.config.js:11) 为 48，[detectDeploymentMode](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/ServerMonitor/utils.js:113) 为 41。数字来自 ESLint，包含其对条件表达式等语法的计算；它们不是“嵌套了 48 层”。

后端按 if、for、while、switch 等控制语句计层，306 个生产文件中最高为 4。重点位置：

| 位置 | 控制嵌套 | 判断与最小处理 |
| --- | ---: | --- |
| ArticleCommentServiceImpl.batchDelete | 4 | 根评论分支里再对每个已通过子评论循环扣量，放大 SQL 次数；随 R11 汇总数量并一次原子更新 |
| ArticleCommentServiceImpl.getCommentTree | 4 | 遍历→根/子分支→根存在→children 判空；可先初始化根列表，再组装回复，减少嵌套，保留孤儿节点处理 |
| MessageServiceImpl.getMessageTree | 4 | 同一树组装形状，还套了带可选 visitorId 的查询回调；条件为空的情况在拼查询前处理更直接 |
| 两类 notifyParentIfNeeded | 3 | 父节点、通知开关、邮箱类型层层嵌套且重复；前置返回无资格情况，复用联系方式解析与已有邮件服务 |
| UserAgentServiceImpl.getBrowserName/getOsName | 2 | 分别有 17/12 个决定节点，主要为识别顺序；不能只为降低数字打乱 Edge/Chrome、iOS/macOS 等优先级 |

这些结构问题不建议用“每个 if 提取成一个方法”处理。局部函数捕获当前状态、事件回调中的 nextTick、树查询的条件包装都有实际用途。只提取重复且责任明确的步骤；必要的校验、清理和失败处理不能为了拉平代码而删除。

### 5.2 前后端重复实现清单

下列 D 编号是维护与精简建议；其中已有正确性问题的条目引用 R 编号，避免重复计入 38 项业务问题。

| 编号 | 重复位置与证据 | 建议的最小改动 | 不应扩大成 |
| --- | --- | --- | --- |
| D01 | Blog Article 与 Message 页重复表单默认值、字段校验、验证码加载、emoji 光标插入、头像解析、日期显示及树计数；同一变更需改两套 | 先共享纯工具和最小表单状态，再按实际差异保留文章 ID、回复/编辑、提交 API；统一 R01/R03/R31 的修复点 | 一个配置几十项的“万能评论系统” |
| D02 | Admin ArticleEdit、Profile、Music、FriendLink 多次重复 new FormData→append file→uploadFile；API 已存在统一上传入口 | 让现有上传 API 接受 File 并负责构造 FormData，页面只负责类型校验、loading 和结果赋值 | 另建上传任务队列或插件层 |
| D03 | NetworkPanel 和 DiskIoPanel 的 makeLineOption 约 48 行逐项相同；CPU/网络/磁盘还有相似的图表初始化、resize、dispose | 先共享同一监控目录下的折线配置；若同时修生命周期，再共享小型 useChart，图表数据各页负责 | 全项目通用图表描述语言 |
| D04 | Admin 多个 Store 的 approve/remove/reply 仅 async await 转发 API，没有状态操作；列表状态形状也高度相似 | 纯转发操作可直接使用现有 API；保留有列表缓存、刷新等责任的 Store。useBatchSelection 已在多页复用，应继续使用 | 把所有领域 Store 改成泛型 CRUD 工厂 |
| D05 | Admin/Blog 的 EmojiPicker 脚本及表情数据重复，Markdown 锚点核心复制并靠测试对齐；Home/CV 重复浏览器特征采集，请求封装接近 | 同一前端仓库内优先共享稳定纯工具/数据；HTTP 仅共享确实相同的部分，保留 Admin 的认证和响应形状差异；锚点跨 Java/JS 保留契约测试 | 为少量文件发布独立 npm 包，或把 Java/JS 强行共用实现 |
| D06 | Layout、Category/Tag mounted 都调用 blogStore.init；loaded 只在请求结束后置 true，无法复用正在执行的 Promise；Footer/Sidebar 分别取开始时间 | Store 复用一次进行中的初始化，成功数据继续复用，失败可重试；已有站点配置在一处读取即可 | 长期缓存所有动态数据或复杂状态机 |
| D07 | 前端监控重复推断后端已给出的部署模式，还兼容 runtimeMode/environmentType 和多组硬件猜测；后端同一响应已有 deploymentMode、说明和 tips | 按当前唯一后端契约读取 server/container 及说明，缺失时明确未知；保留必要的数组默认值，删除没有消费者承诺的猜测 | 第二套浏览器端硬件环境识别器 |
| D08 | Admin 手工分包覆盖大量 CodeMirror/Lezer 传递依赖；element-plus 判断在 icons 判断之前，使单独 element-icons 分支无法命中 | 移除不可达分支，按实际构建图保留少数有依据的大类或用 Vite 默认；本次构建通过，未证明该配置造成页面变慢 | 为每个传递依赖继续增加分包规则 |
| D09 | 后端 AdminController 与 JWT 拦截器两个 Cookie Token 读取方法，AST 方法体相同 | 在现有 JWT/Cookie 相关工具中保留一个读取函数，两处调用，统一解码错误处理 | 完整自定义会话框架 |
| D10 | 博客 ArticleController 两个 mergeRedisCount 重载，AST 方法体相同，只有 VO 类型不同；列表逐条各读两个 Hash | 提取已有增量读取步骤，保留两类 VO 的简单赋值；列表可一次按 ID 批量取增量，修 R12 时统一口径 | 为去掉两个 setter 迫使 DTO 改继承层级 |
| D11 | 后端评论/留言重复位置拼接、Markdown/HTML 分支、邮箱/QQ 校验和通知；QQ 校验接受 5–12 位，通知解析和前端头像只接受到 11 位 | 共享联系方式解析、输出过滤和地点格式化；先统一允许范围，再让校验、通知、头像使用同一约定，避免“接受了却无法通知” | 抽象整个内容 CRUD 或新增通用规则引擎 |
| D12 | 后端两类树组装与评论两类删除逻辑重复，前端也各自递归数树；审核、删除和计数规则容易分叉 | 优先修 R11/R19/R22，再提取局部重复步骤；两层树不必反复递归，层级规则由服务端确定 | 为两种 VO 建反射树框架 |
| D13 | ArticleMapper.xml 多个查询重复文章投影列和分类 JOIN，热门榜查询主要差在过滤和排序 | 用 MyBatis 已有 sql/include 共享投影和 JOIN，保留有语义的查询名和绑定参数 | 动态拼任意列名/排序字符串或更换 ORM |
| D14 | 文章多个变更方法复制相同缓存驱逐组，但分类、标签、评论相关依赖又遗漏 | 随 R12 定义少数业务级失效入口或同语义组合注解，在成功提交后执行；不再逐方法手抄名单 | 全局清所有缓存、反射推导缓存依赖图 |

定位参考：[评论表单](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Article/index.vue:213)、[留言表单](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/view/Message/index.vue:99)、[重复上传](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/Profile/index.vue:77)、[网络折线配置](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/ServerMonitor/NetworkPanel.vue:43)、[磁盘折线配置](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Admin/src/view/ServerMonitor/DiskIoPanel.vue:44)、[Token 读取](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/admin/AdminController.java:139)、[重复计数合并](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/controller/blog/ArticleController.java:135)、[文章 SQL](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/resources/mapper/ArticleMapper.xml:77)。

### 5.3 可以删除与应当保留的重复

- Blog 的 [HotArticleSection](D:/CodingFiles/Blog/DriftingLeavesOfFront/Frontend-Blog/src/components/HotArticleSection.vue:1)约 756 行，包含与 Hot 页面相同的热门读取与筛选逻辑，但当前源码没有引用。确认当前产品不使用后直接删除，比先抽两个消费者共用逻辑更小。
- Admin serverMonitor API 里除 snapshot 外的一组单面板读取，在当前前端只有导出、没有调用；getConfigById、getAllActiveRss、getRssById 等也没有使用方，可清理前端死导出。不能由此删除可能有其他消费者的后端端点。
- CV 的 Pinia 入口未被 main.js 安装或页面使用，Home/CV 的 package 配置也复制了一些当前无消费者的依赖。按实际 import 图删减，保留构建插件确实需要的依赖。
- 后端三个 systemConfig Controller 和多个 visitor Controller 的薄转发虽然相似，已经共用同一个 Service；不同站点和管理端有不同路由/权限边界，不建议为消除几行转发而合并成万能 Controller。
- 前后端分别做输入校验有各自的责任：前端用于及时反馈，后端用于信任边界，不能删掉后端验证来“去重”。应统一字段约定与边界测试。
- 以现有 useBatchSelection、formValidate、MarkdownUtil、EmailService、PageResult 为优先复用入口，不另写第二套同类工具。Java 与 JavaScript 的锚点规则跨语言重复是合理的，已有契约测试应保留。

### 5.4 其他已识别的精简建议

这些项不是阻断上线的缺陷。建议随着相关修复顺手处理，不单独开展大规模重构。

| 项目 | 现有证据 | 建议 |
| --- | --- | --- |
| 未使用的 JCache 集成依赖 | 运行时缓存使用 RedisCacheManager，限流直接构建 Bucket；源码未调用 JCache API | 从 server 和父 POM 清理 bucket4j-jcache、cache-api、Caffeine jcache 中实际不再需要的项；R21 若用 Caffeine，保留其直接所需依赖 |
| 未启用的 Markdown 扩展 | POM 引入表格、自动链接、任务列表扩展，Parser/Renderer 均未注册扩展 | 产品不需要就删依赖；若编辑器已承诺这些语法，应注册现有扩展并加一个包含三类语法的测试，不能直接删功能 |
| 未被引用的执行器 | mailTaskExecutor、dataSourceExecutor 没有调用方；邮件实际使用 taskExecutor | 删除无效 Bean；在已启用 Boot 虚拟线程的前提下核对手工 Tomcat/MVC 配置是否仍必要，保留有明确用途的部分 |
| 无调用的旧方法 | ArticleServiceImpl.buildQueryWrapper；FingerprintServiceImpl.extractBrowserInfoWithVersion 及其专用正则 | 删除未使用的替代实现和“以后可能用”的注释 |
| 限流注解未实现的 USER 类型 | 枚举有 USER，切面没有对应分支，目前也没有使用方 | 无需求就移除该枚举值，避免看起来支持、实际退化成共享 key；有现有消费者才补实现 |
| 重复且不一致的 IP 获取 | SecurityLogConfig 与 IpUtil 的代理头优先级不同 | 合并到一个已核实代理信任边界的实现；否则业务日志和限流可能认为同一请求来自不同地址 |
| 重复解析与采样 | 提交内容分别解析两次 User-Agent；监控按每个资源重复枚举设备，全局和 CPU 详情重复查 CPU Top5 | 在一次请求/采样中复用结果即可，无需长期缓存硬件对象或新增采集框架 |
| 过量解释性注释 | SecurityLogConfig 等文件有大量实现步骤和未发生需求的扩展建议 | 保留代理信任、采样基线等必要原因，删复述代码和未来方案，避免注释与真实行为脱节 |

可定位参考：[虚拟线程配置](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/config/VirtualThreadConfiguration.java:41)、[限流类型](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/annotation/RateLimit.java:52)、[MarkdownUtil](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/utils/MarkdownUtil.java:18)、[安全日志配置](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/config/SecurityLogConfig.java:31)。

## 6. 部署与接口约定：需要核实后再定修改范围

下列代码事实已确认，但是否需要改变依赖尚未明确的部署或产品约定，因此不混入上面的 38 项已定位问题。

| 事项 | 代码事实与需要核实的条件 | 建议 |
| --- | --- | --- |
| CORS 与 Cookie | WebMvcConfiguration 接受任意 Origin 并 allowCredentials=true；Cookie 为 SameSite=Strict。同站其他来源是否可信、代理如何暴露服务未知 | 按实际前端域名限制凭据接口的 Origin；不能仅凭当前配置就断言任何跨站网页都能携带 Strict Cookie 攻击 |
| 代理 IP 与 Secure Cookie | IpUtil 无条件信任代理头，注释假设只经 Nginx；Cookie Secure 根据 request.isSecure 决定，本地未见转发协议配置 | 验证后端不对外直连、Nginx 覆盖而非透传可信头，并确认 HTTPS 经过代理后实际返回 Secure。若这些已由部署保障，无需重复造代理识别框架 |
| 密码存储 | EncryptPasswordServiceImpl 使用一次 SHA-256(password+salt)，没有工作因子 | 如账户数据泄露，离线猜测成本偏低。采用标准带成本的密码派生方案，优先评估 JDK 自带 PBKDF2；保留旧哈希识别及登录后升级/重置迁移，不可直接更换算法令所有旧密码失效 |
| Redis 反序列化 | RedisConfiguration 对 EVERYTHING 开启多态，使用允许所有子类的校验器；注释“防止漏洞”并不代表限制生效 | 如果 Redis 写入方不全可信，应限制允许类型或改为明确类型序列化；没有恶意 Redis 写入路径的证据，本文不声称已存在可远程利用的反序列化漏洞。更改格式需处理已有缓存 |
| 全部配置可公开查询 | home/blog 的 systemConfig 按任意键返回实体，没有公开键白名单 | 核对表里是否只放公开展示配置；若包含后台或私有项，限定公开键或拆分专用读取。当前不能证明实际已泄露密钥 |
| 日期精度与绑定 | Jackson 和 Redis 格式实际为 yyyy-MM-dd HH:mm，多处注释/JSONField 写秒；分页 DTO 日期用于 GET 绑定时 JSONField 不负责 MVC 转换 | 明确接口精度并统一 Jackson、Redis 与 GET 的 DateTimeFormat。若需要秒级排序和展示，避免 Redis 往返丢秒；覆盖“冷读/缓存命中”行为一致 |
| Ctrl/Cmd+S 与已发布文章 | 快捷键及离页保存都明确调用 handleSave(0)，后端更新会把已发布文章设为未发布；已在模拟检查中复现，代码注释称其“保存草稿” | 确认“保存草稿”是否应撤下线上文章。若是当前产品规则，保留并明确提示；若只是保存修改，快捷键应保持发布状态，撤稿单独执行。未确认前不自行实现版本草稿系统 |
| 访客报表累计口径 | totalVisitorCountList 从查询区间第一天的新访客开始累加，没有区间前的存量 | 若界面含义是全站累计，应补查询起点之前的基数；若只是区间累计，则改说明与命名即可，不增加查询 |
| 本月热门口径 | SQL 按文章发布时间属于本月筛选，再按总计数排序 | 确认产品意图是“本月发布的热门文章”还是“本月发生的访问/点赞”。后者需要事件时间维度，不能靠改字段别名实现；前者仅修正文案 |
| 监控部署和新鲜度 | 监控键不含实例标识，current 数据无 TTL，聚合接口分别读取多个键 | 单实例需让消费端识别 collectTime 的陈旧；若实际多实例共享 Redis，会互相覆盖机器指标，届时再按实例隔离。同批快照要求需由产品决定，不先增加快照版本框架 |
| WebSocket 在线人数 | 统计 JVM 内连接数，每个标签页都会计数，没有跨实例聚合 | 若文案只表示连接数，改文案即可；若要跨实例去重用户数，需要明确身份和部署范围后实现 |
| 项目可复现交付 | Git 忽略全部 YAML 与完整建表 SQL，仓库缺无密配置模板和完整建库入口 | 提供脱敏的 example 配置、基础 schema 和启动说明；凭据继续外置。不能直接把当前本地生产配置解除忽略后提交 |

参考：[WebMvcConfiguration](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/config/WebMvcConfiguration.java:58)、[IpUtil](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/utils/IpUtil.java:77)、[密码散列](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/service/impl/EncryptPasswordServiceImpl.java:24)、[RedisConfiguration](D:/CodingFiles/Blog/DriftingLeaves/DL-server/src/main/java/com/xuan/config/RedisConfiguration.java:65)、[JacksonConfig](D:/CodingFiles/Blog/DriftingLeaves/DL-common/src/main/java/com/xuan/json/JacksonConfig.java:37)。

## 7. 建议实施顺序与最小验收集

| 批次 | 范围 | 完成标准 |
| --- | --- | --- |
| 1：封住公开写入和敏感信息路径 | R01–R05、R19；R23 随身份方案一起处理 | 双访客权限隔离，公开响应不含联系方式，所有内容分支安全，编辑重新审核，日志无凭据 |
| 2：恢复稳定的正常操作 | R06–R09、R25–R30、R34、R35 | 改密后能登录，错误日期立即失败，上传结果正确，编辑不丢稿，草稿后续更新同一篇，失效会话可重新登录，验证码与身份就绪流程可用 |
| 3：数据和审计正确性 | R10–R18、R20 | 计数状态与并发一致，缓存变更可见，失败重试规则明确，Token 与验证码生命周期正确，审计可定位操作者并保存合法 JSON |
| 4：控制资源与精简实现 | R21、R22、R24、R31–R33、R36–R38、第 5 节 D01–D14 | 历史 key 可回收，树查询有界，连接与轮询生命周期正确，局部接口失败不清空整页，重复代码在负责层收敛，删除项不影响现有功能 |

只为实际修复补最小回归测试，不追求机械提高覆盖率：

- 权限与内容：双会话越权、公开字段检查、非 Markdown 危险 HTML、编辑再次审核。
- 账号与上传：修改后登录、验证码并发一次消费、过期 Token 不占名额、大小图与 OSS 失败。
- 一致性：并发点赞、并发审核、文章编辑与计数同步交错、数据库提交后确认失败、锁过期接管、预热缓存后变更。
- 审计与输出：真实异步代理的管理员 ID、长正文的 JSON、含特殊字符的 RSS、反向日期输入。
- 前端流程：校验失败时阻止离页、保存新稿后继续更新同一 ID、401 最终停在登录页、访客初始化慢于页面时状态能恢复、旧请求后返回不覆盖新选择。
- 生命周期与降级：离页不重连 WebSocket、不启动遗留轮询，慢请求不重叠，一个可选接口失败不影响已成功的数据；API 拒绝只提示一次并保留表单。

继续沿用现有 JUnit、Mockito、MockMvc 和 Node 测试能力；前端已有 Vue 编译器与 ESLint 可用于静态检查。涉及 Redis Lua 与 MySQL 事务语义时再用隔离的真实服务测试；Mock 不能证明真实 Redis 原子性或跨存储故障恢复。不为本次建议清单先增加前后端测试框架。

## 8. 本次未做的工作与结论边界

- 没有修复上述业务问题，没有改动前后端源码、配置、已有未提交修改或测试，没有增加依赖或通用重构框架。只更新本文档；只读检查使用的临时脚本、日志及构建产物位于后端被忽略的 tmp 目录。
- 没有启动本地配置默认指向的生产 profile，没有连接真实 MySQL、Redis、SMTP、OSS，没有执行建表、迁移或数据清理。
- 没有做真实浏览器端到端或逐屏视觉验证、并发压测、Linux/Docker 硬件采样校准、线上代理与权限验证，也没有联网进行依赖漏洞库扫描；没有声称依赖不存在已知漏洞。
- 后端 33 项现有测试、前端 4 项锚点测试、四应用构建及只读 lint 均通过。它们不能覆盖本文列出的访客权限、完整审核流程、跨存储故障和全部前端交互；模拟源函数检查与真实浏览器验证的边界已单独说明。
- 后续修复需保留认证、输入校验、错误语义和数据迁移；不建议为这些问题直接引入微服务、消息队列、多级缓存或通用权限平台。
- 当前交付物是供用户审阅的建议文档。用户确认问题与修改范围之前，不实施上述任何代码、配置或数据库变更。
