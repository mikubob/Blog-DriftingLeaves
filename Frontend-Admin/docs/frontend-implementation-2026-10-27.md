# 前端审查修复实施记录（2026-10-27）

后续规范与质量整改、最终验证和同步见 [2026-10-28 跟进](frontend-quality-followup-2026-10-28.md)。本文保留为上一轮历史记录。

实施依据：`D:\CodingFiles\Blog\DriftingLeaves\docs\code-review-2026-10-26.md` 全文及已批准的修改范围。使用 Stop That Shit change、Ponytail full；没有扩大为新框架、通用 CRUD 工厂、自动保存系统或独立 npm 包。

源码目录：`D:\CodingFiles\Blog\DriftingLeavesOfFront`。初始 Git 工作区干净，HEAD 为 d9cedbb。Website 初始仅有 Backend 的三份独有未跟踪方案文档；没有修改这些文档。后端源码及文档均只读，前端权限判断不作为后端鉴权的替代。

## 1. 四站结果与范围

| 应用 | 本次结果 |
| --- | --- |
| Admin | 修复离页保存、进行中的保存等待、创建 ID 回填、401 状态清理、改密字符规则与换邮箱验证码入口；处理列表/详情/图表竞态、监控轮询与图表生命周期、请求错误归属和取消确认；合并上传入口并清理纯转发 Store 操作。 |
| Blog | 适配签名访客凭据、私密内容公开字段、isOwn/头像、服务端验证码、根节点分页、编辑重新审核、RSS 确认/更新/凭据退订；修复旧请求覆盖、初始化依赖、重连清理、开发 WS 代理和局部失败降级。 |
| CV | 复用浏览器信息采集和公开请求处理；保存服务端访客凭据；独立展示区加载、错误重试、403 路由与卸载清理；删除未使用 Pinia 入口和依赖。 |
| Home | 同步上述访客、错误、独立加载、403 与生命周期修复；去掉无用途的 ConfigProvider；保留实际用于错误提示的 Element Plus。 |

## 2. R 编号对应结果

| 编号 | 前端实施与边界 |
| --- | --- |
| R01、R23 | 三站请求发送 `X-Visitor-Token`；record 响应的 visitorToken 持久化，本地 visitorId 不再承担授权。Blog 仅持久化昵称和联系方式缓存，不恢复旧数字 ID 为已验证身份；失效凭据清除并重新建立会话。Home/CV 同样保存新签发凭据。 |
| R02 | 评论/留言使用后端 `isOwn`、`avatarUrl`；不读取公开 emailOrQq 或按本地 ID 推断权限，非博主头像缺失时用首字母默认头像。私密正文及回复的可见性由后端控制，未用前端隐藏代替鉴权。 |
| R03 | Hero 元信息改为文本插值，文章不再手工拼 HTML。评论/留言及后台审核 HTML 继续消费后端安全输出；已核对后端 pageQuery、convert、prepare 对历史及新增内容调用 DiscussionUtil.html。没有增加第二套前端清理器。 |
| R04 | 编辑成功明确提示需重新审核，重新加载当前树；格式字段仍随编辑提交。审核状态、计数和缓存修复在后端。 |
| R05 | 后端日志职责；前端未新增密码、验证码或凭据日志。 |
| R06 | 登录删除密码字符白名单，保留 6–32 位；设置页同步长度校验。改密成功后清理会话并进入登录页，避免对已被后端注销的 Cookie 再请求退出。 |
| R07 | 后端拒绝反向/超长区间；Dashboard 在日期选择清空时不发送空区间请求，日期请求只应用最新结果。未自行改变统计口径。 |
| R08、R09 | 上传 API 接收 File 并构造 FormData，由浏览器生成 multipart boundary；各页面只在 API 成功后赋值和提示成功。格式转换、OSS 异常语义在后端修复。 |
| R10–R12 | 后端负责原子计数及缓存。前端点赞失败保留已确认状态，旧文章点赞完成不修改新文章；评论变更重载树。未声称前端实现强一致。 |
| R13、R14 | 跨存储同步/租约仅在后端处理，前端无对应实现。 |
| R15 | 管理端认证 Cookie 契约保留；401 先清空 Pinia 用户与登录状态，再 replace 登录页，合并并发提示；启动 silent 语义保留。Token 成员迁移在后端。 |
| R16 | 登录邮件验证码入口保留，换邮箱使用新的认证入口；倒计时卸载清理。验证码原子发送、消费与冷却由后端保证。 |
| R17、R18 | 异步审计与 JSON 截断仅在后端处理。 |
| R19 | 访客回复只传 parentId，删除客户端推导的 rootId/parentNickname；服务端推导关系和验证文章归属。管理员回复继续沿用 parentId 契约。 |
| R20 | 编辑使用 PUT；首次/换邮箱成功只提示查收确认邮件，不直接标为已订阅。同邮箱更新仍由后端决定。首页处理 rssConfirm/rssUnsubscribe 查询参数，确认 POST、退订 PUT 携带 token；成功移除参数并刷新侧栏状态。失败保留重试入口，退订先确认。 |
| R21 | 限流桶生命周期在后端处理，前端无需复制。 |
| R22 | 评论和留言改用 `/page`，读取 PageResult.records/total，分页单位为根节点，每页 10 根且保留本页回复；页面区别主节点总数和本页含回复条数。删除最后一页最后一个根后回退一页。 |
| R24 | 首帧采样在后端处理；前端直接消费采样结果。 |
| R25 | 保存仅在 API 成功后关闭表单和提示成功；统一请求层保留业务/HTTP 失败，服务端更新 ID 校验由后端负责。 |
| R26 | RSS/XML 在后端生成，前端保留原 Feed/Sitemap 链接，不增加 Feed 生成器。 |
| R27 | 保存返回布尔结果并共享进行中的 Promise；校验失败、API 失败、保存期间继续输入都阻止“保存后离开”。成功才更新提交内容的快照；明确“不保存”仍放行，关闭确认框仍留页。初始化未完成/失败时不能保存空白详情，卸载后不继续初始化编辑器观察器。 |
| R28 | 创建响应 data 直接回填 form.id，后续保存走更新；等价编辑状态和标题同步，不按标题猜 ID。保留编辑期间输入。 |
| R29 | 由 main.js 注册会话失效回调，请求层不再引入路由/Store 依赖环。清状态在跳转之前执行；并发 401 只提示一次。编辑器仍保留未保存内容确认规则，不自动丢稿。 |
| R30 | 使用 `POST /admin/admin/sendChangeEmailCode`，不提交不存在的 username；删除重复动态导入。 |
| R31 | 题目仅使用 captchaId/question；创建提交携带 captchaId/captchaAnswer，不比较返回答案。前端只校验完整整数，错误提交后换题且保留正文；编辑不额外要求挑战。挑战等待同一访客初始化、去重正在进行的读取，卸载后不再发起后续读取。 |
| R32 | 侧栏卸载先关闭重连资格、清理重连/心跳，再关闭连接；已排队回调也不能复活组件。意外断线仍可重连。 |
| R33 | 开发/生产均连接当前主机 `/api/ws/online`；Blog Vite `/api` 启用 ws 转发并重写前缀，后端实际端点仍为 `/ws/online`。本次未连真实后端做 101 握手。 |
| R34 | Admin 可重入列表、文章详情弹窗、Dashboard 日期；Blog 文章/评论/点赞、首页搜索、分类/标签/热门及留言分页使用各自请求序号，只接收当前结果。卸载使页面请求失效。Profile 共享 loading 使用在途计数，避免独立模块提前结束遮罩。 |
| R35 | Blog 访客 Store 共享初始化 Promise；依赖读写等待 record，失败可见并可重试，ready 后重新加载本人内容、点赞及订阅状态。公开内容读取仍允许初始化失败后的公开浏览。 |
| R36 | 监控请求结束后 setTimeout 下一次，切换/手动刷新取消旧请求，卸载取消在途请求及后续调度；错误以页内状态显示并自动重试，不每轮弹 toast。 |
| R37 | Blog/Home/CV 并行请求独立赋值，保留成功数据；Blog 只重试失败模块且复用进行中的 init；页面提供失败重试。 |
| R38 | 公开三站统一请求错误出口，429 保留页面/表单，403 才显示受限页；Home/CV 注册现有 403 页面。Admin 保留自身响应形状，删除重复错误 toast；列表/设置页接住已提示的读取失败；确认取消正常返回。 |

## 3. 第 5 节精简对应结果

| 编号 | 结果 |
| --- | --- |
| D01 | Blog 新增局部 useDiscussionForm，共享默认值、校验/错误、挑战读取、emoji 插入及纯头像/日期工具；提交 API、文章 ID、编辑/回复逻辑留在页面。 |
| D02 | 复用现有 uploadFile，四类页面及编辑器不再重复构造 FormData。 |
| D03 | 监控目录共享 makeLineOption 和 useChart；网络/IO/CPU 保留各自数据转换，统一初始化/resize/dispose，修复 await nextTick 后卸载仍启动图表的路径。 |
| D04 | 评论、留言、访客、文章纯变更、音乐删除、审计删除、RSS/浏览记录变更、资料删除直接用 API；保留真实列表状态、刷新责任和保存分流的 Store。继续使用 useBatchSelection。 |
| D05 | Frontend-Shared 实际复用 EmojiPicker/数据、锚点核心、浏览器信息、访客凭据存储和公开错误处理；Admin 认证与响应形状独立保留。四应用 Vite 设置共享别名、Vue dedupe、开发文件访问范围，jsconfig 同步别名。没有独立 npm 包。 |
| D06 | Blog init 复用 Promise、按模块保留成功结果并允许失败重试；Footer/Sidebar 共用原 useSiteRuntime 的开始时间请求。 |
| D07 | 删除前端硬件猜测和历史字段兼容，只读取 deploymentMode/deploymentModeText/deploymentTips；缺失显示未知。 |
| D08 | Admin 分包仅保留 Element、ECharts、编辑器三个有据类别；删除不可达 icons 分支和手写传递依赖清单。构建仍有大 chunk 警告，未声称已经测得页面加速。 |
| D09、D10、D13、D14 | 后端负责，没有修改后端或为跨语言去重增加框架。 |
| D11、D12 前端部分 | 表单保持后端允许的 5–12 位 QQ；不再从公开联系方式解析头像；两层树本页计数直接求和，完整分页/关系校验由后端负责。 |

确认无引用后删除：两份旧 EmojiPicker、两份旧 emoji JSON、Blog HotArticleSection、CV 未安装的 Pinia 入口；清理 Admin 非 snapshot 监控 API、getConfigById/getAllActiveRss/getRssById。Home/CV 删除无消费者的 Pinia、持久化插件、直接 icons 和注释状态 DevTools 依赖，锁文件同步更新；保留被当前通知 UI 和构建配置使用的依赖。

## 4. 接口核对

收尾时重新完整读取 `D:\CodingFiles\Blog\DriftingLeaves\docs\implementation-api-contract-2026-10-27.md` 的“已确定”最终契约及后端实施记录（后端报告 68 项测试通过，本对话未重跑后端测试），并只读查看实际 VisitorTokenInterceptor、VisitorServiceImpl、Admin/Blog Controllers、DTO/VO、DiscussionUtil 及评论/留言转换方法。响应继续是 Result，Admin 请求层返回 Result，公开三站保留 AxiosResponse；没有擅自改变调用层数据形状。

特别核对：新文章 ID 为 JSON 数字；换邮箱入口无 body；captchaAnswer 为字符串；公开树 records 为根节点；isOwn 为布尔；avatarUrl 当前为空；RSS confirm 和 unsubscribe 的凭据位于 token 查询参数；临时限流 HTTP 429 带 Retry-After。运行中的 Cookie 认证及服务端授权职责不变。

## 5. 验证命令与真实结果

| 检查 | 结果 |
| --- | --- |
| 根目录 `node --test Frontend-Admin/tests/frontend-regressions.test.mjs Frontend-Blog/tests/*.test.js` | 20 项通过，0 失败；包含原 4 项锚点契约测试。VM 使用实际源函数及受控网络/生命周期宿主，不冒充 E2E。 |
| 四应用分别 `node node_modules/eslint/bin/eslint.js src vite.config.js --rule 'prettier/prettier: off' --rule 'complexity: [warn, 18]' --rule 'max-depth: [warn, 4]' --rule 'max-nested-callbacks: [warn, 3]'` | 0 error、0 warning；没有运行项目带 --fix/--cache 的 lint 命令。 |
| 根目录 `node Frontend-Admin/node_modules/eslint/bin/eslint.js --config Frontend-Admin/eslint.config.js Frontend-Shared --global window --global document --global navigator --global localStorage --global sessionStorage --global Event --rule 'prettier/prettier: off'` | 通过；共享 mjs 的浏览器全局显式声明。 |
| 四应用分别 `node node_modules/vite/bin/vite.js build` | 全部生产构建通过；Admin 有大于 500 kB 的 chunk 警告，Blog/CV/Home 无同类警告。直接执行安装好的 Vite，等价于项目 build 脚本的构建动作。 |
| Home/CV `pnpm install --lockfile-only --offline --ignore-scripts --config.manage-package-manager-versions=false --config.verify-deps-before-run=false` | 成功更新锁文件，未下载/新增运行依赖。工具产生的临时 .pnpm-store 已移除。 |
| `git diff --check` | 通过。 |

浏览器使用已读的 Playwright 技能及现有运行时库、本机 Chrome 156，无新增测试框架。CLI 不在当前环境中，采用库脚本隔离请求；API 全部由 route.fulfill 模拟，外部资源阻断。四站生产预览地址为回环 5291–5294。结果：

- Admin：保存校验失败不离页且无写请求；新稿 POST 后再次保存 PUT 同一 ID；401 一次提示并停在登录页；设置页 429 保留当前页，读取拒绝没有未处理 Promise。
- Blog：延迟访客 record 后验证码/订阅带签名头，创建载荷含 challenge ID；429 一次提示且保留输入；RSS 编辑使用 PUT；邮件确认 POST/退订 PUT 消费正确 token，成功移除查询参数并刷新侧栏；留言根分页切换显示新页。
- Home/CV：可选接口 429 时仍展示成功资料、保存 visitorToken、保持首页，现有 403 页面可访问。
- 上述最终失败处理与 RSS 流程复查无浏览器 pageerror。早期开发模式依赖优化自动刷新干扰测试，已换生产预览；未把工具刷新或缺少内置 Chromium 当作项目缺陷。

## 6. Website 文件映射与目标验证

源四个 Frontend-* 应用逐文件映射到 `D:\CodingFiles\Blog\DriftingLeaves-Website` 下同名应用；新建 Frontend-Shared 映射到目标同名目录。包含源代码、public 资产、构建/编辑器配置、package、pnpm 锁文件、回归测试和本报告。只删除上述明确弃用且与源对应的 6 个前端文件；目标独有文件保留。

不复制 .git、IDE、node_modules、dist、缓存、日志或真实密钥；不写 Backend、DockerForDriftingLeaves、已有根公共文件或 Git 索引。不提交、不推送、不部署。

已完成逐文件同步与字节一致性校验：共 195 个文件，Admin 79、Blog 64、CV 20、Home 26、Shared 6；首次差异/新增为 92 个文件，另有 6 个明确弃用文件删除。未采用镜像删除。

目标四应用均从 Website 自身工作目录运行实际同步后的 Vite 配置和源码，四次生产构建全部通过；20 项 Node 回归在 Website 路径再次全部通过。验证期间临时创建四个指向源码已安装依赖的目录联接，没有复制依赖；验证后四个联接均移除，源码依赖仍在。目标构建产物写入源目录忽略的 `validation.local/website-builds/Frontend-*`，没有复制 dist 或清空目标目录。

目标验证命令：在 `DriftingLeaves-Website/Frontend-X` 中执行 `node D:\CodingFiles\Blog\DriftingLeavesOfFront\Frontend-X\node_modules\vite\bin\vite.js build --outDir D:\CodingFiles\Blog\DriftingLeavesOfFront\validation.local\website-builds\Frontend-X`；在 Website 根执行同第 5 节 Node 测试命令。映射中的报告与最后文件更新后再次核对一致。

## 7. 未决定规则及联调边界

- Ctrl/Cmd+S 与离页“保存草稿”仍按原规则提交 isPublished=0；对已发布稿是否应撤稿需要用户决定，没有擅自改成版本草稿或保持发布。保存期间明确提示仍是“保存草稿”。
- 真实前后端联调尚未在本对话运行。Mock 浏览器不能证明服务端签名、双访客隔离、验证码一次性、数据库唯一约束或 SMTP 送达；这些由后端测试与部署联调覆盖。前后端的访客凭据、验证码、RSS 和分页适配需一起发布，部署前先按后端文档处理历史重复订阅及迁移。
- 没有默认连接真实 MySQL、Redis、SMTP、OSS 或线上写入服务，也没有实际 WS 101 握手、跨域代理/Cookie、移动设备逐屏或多实例部署验证。第 6 节其余产品/统计/代理规则未自行改变。
- 同源浏览器存储复用 visitorToken；不同前端域名没有擅自增加跨域存储桥。旧数字 ID/指纹不自动认领历史内容，清理凭据后的归属规则遵循后端契约；后端设备集合升级后旧管理员会话需重新登录，旧邮件验证码需重新发送。
- Frontend-Shared 是源码构建依赖；开发/CI 保留四应用的相邻目录结构即可。发布 dist 无运行时共享目录依赖。既有部署目录未改；若独立构建某一个应用，构建上下文需要包含相邻 Frontend-Shared。
