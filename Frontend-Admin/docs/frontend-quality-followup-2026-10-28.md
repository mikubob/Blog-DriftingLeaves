# 前端规范与质量整改（2026-10-28）

基于上一轮全部未提交成果，使用 [Ponytail full](C:/Users/xuan/.codex/plugins/cache/ponytail/ponytail/5.3.2/skills/ponytail/SKILL.md) 与 [Stop That Shit change](C:/Users/xuan/.codex/plugins/cache/stop-that-shit/stop-that-shit/0.2.5/skills/stop-that-shit/SKILL.md) 继续直接整改。已读取上一轮实施记录、后端最终 API 契约、质量跟进和迁移文档；后端只读。未找到适用 AGENTS.md。没有 reset/revert、提交、推送或部署。

## 职责与说明

- Admin 文章详情的无状态 Store 转发移除，列表预览和编辑器直接消费既有 `getArticleById` 的 Result；Store 保留文章列表、分类/标签共享状态与创建/更新分流。两个调用者及回归同步调整。
- Blog 表单默认值、校验状态创建、头像与日期格式移到 `utils/discussion.js`；`useDiscussionForm` 只负责响应式输入、校验和挑战生命周期。文章、留言两个消费者改为分别导入，没有保留无消费者的转发导出。
- Home/CV 的访客 API 只发请求、返回 AxiosResponse；共享 `useVisitorSession.mjs` 负责浏览器信息采集、在途 Promise、签名凭据持久化、失效重建、失败重试和卸载取消。Blog 保留真实跨页访客 Store，事件监听随 Store scope 清理。
- 监控的资源选择协调从 utils 移到页面；utils 保留无状态快照/选项转换。`useChart` 继续管理实例生命周期，面板负责各自数据到序列的转换。
- 补齐请求/凭据模块、变更 API、Store、composable、共享锚点/浏览器工具、表情组件及监控面板的有价值说明：响应形状、错误传播、归属来源、提交副作用、输入/输出及生命周期。纠正原先注释落在请求序号变量而非函数上的位置；没有逐项复述模板或给普通 ref 堆注释。

## 实际问题与修复

- 公开请求的旧 401 曾可能清除新签发凭据；现在仅失效本次请求实际发送且仍为当前值的 Token。访客 record 仍只允许去掉失效凭据重试一次，业务写入不自动重放；成功保留 AxiosResponse，业务/HTTP 失败继续拒绝原错误。Admin 保留 Result、silent 恢复、并发 401 一次提示和先清状态再 replace 登录；取消请求不再错误提示。403 和 429 路由行为保持区别。
- 验证码卸载后调用原先可能重新启动请求，已增加存活判断；等待访客初始化后与返回后均检查有效性。登录/换邮箱的验证码响应卸载后不再重建倒计时。
- Home/CV 不再在资料请求结束后才记录访客；访客流程单独随挂载启动，卸载取消在途记录并阻止写入凭据。资料区共享进行中读取、保留成功区、只重试失败区，卸载取消请求并阻止数据/观察器写回。
- Dashboard 多个独立读取原先从挂载/事件直接启动，失败缺少收口；现在按区显示重试状态，失败不清空成功图表。保留日期序号保护，卸载取消读取、动画帧和图表。分类/标签共享 loading 改为原有 Profile 模式的在途计数，避免任一区先完成就撤销遮罩。
- Admin 详情失败/未初始化时保存按钮禁用，逻辑同样阻止空白覆盖；预览切换先清旧内容、卸载失效详情响应。保留创建 ID 回填、共享保存 Promise、提交快照与期间输入、校验/API失败留稿、离页确认及 Ctrl/Cmd+S/isPublished=0 规则。
- Blog 点赞需先读到本人状态，状态失败可点击原入口重新读取；初始化后的读取不再打断进行中的变更并卡住 liking。旧文章/旧点赞结果继续被序号拒绝；等待初始化后增加存活检查，卸载后不继续发起写请求。
- 分类/标签页等待列表完成后更新 Hero 的路径补上存活判断，避免已经卸载的旧页面覆盖新页面标题。
- 侧栏在初始化后/WS已排队回调中重新检查存活；凭据失效清除旧订阅归属，成功初始化再读取。RSS 邮件成功才消费查询参数，失败保留重试；处理期间换链接会接续新链接。查询参数变化不再清空同页 Hero。首次/换邮箱仍只提示确认邮件，编辑 PUT、确认 POST、带 token 退订 PUT 均保留。
- 浏览器发现 Blog 页顶失败重试按钮被固定导航遮住，提示移至 Hero 下方，恢复实际可点击性。
- 后台评论/留言的原始 content 回退改为文本插值，不能因 contentHtml 缺失变成未经清理的 HTML。后端文章 HTML 与讨论 HTML 的清理调用及已安装 MdPreview 的清理流程已只读核对，没有添加第二套 HTML 清理框架。
- 共享 `safeLink` 拒绝外部数据中的可执行协议，四站实际外链消费者同步使用，保留 HTTP(S)/相对链接。补齐编辑/讨论/RSS 字段的可访问名称，验证码刷新与点赞的键盘操作、表情展开状态/Escape，RSS 入口改为原生按钮，未做视觉重做。

## 验证

所有命令使用已安装 Node v24.18.0、pnpm 11.9.0、项目 ESLint/Vite，无联网升级和新测试框架。下面结果以最终源码重跑日志为准，不沿用历史通过结论。

- 根目录：`node --test Frontend-Admin/tests/frontend-regressions.test.mjs Frontend-Blog/tests/*.test.js`，34 项通过，0 失败/跳过。原 20 项保留，新增 14 项覆盖初始化失败禁止保存、旧/当前 401、record 单次重试、验证码与访客卸载、Home/CV 独立失败重试、验证码倒计时、Dashboard 失败、链接边界、分类并发 loading、点赞读取与变更交错、分类/标签卸载后不覆盖 Hero。VM 宿主执行实际源码，非源码字符串存在性断言，也不称为浏览器 E2E。
- 四应用分别：`node node_modules/eslint/bin/eslint.js src vite.config.js --rule 'prettier/prettier: off' --rule 'complexity: [warn, 18]' --rule 'max-depth: [warn, 4]' --rule 'max-nested-callbacks: [warn, 3]'`，0 error、0 warning。沿用历史参数，无 --fix/--cache。
- 共享模块：`node Frontend-Admin/node_modules/eslint/bin/eslint.js --config Frontend-Admin/eslint.config.js Frontend-Shared --global window --global document --global navigator --global localStorage --global sessionStorage --global Event --global AbortController --global URL --rule 'prettier/prettier: off'`。只显式声明 mjs 浏览器全局，没有降低业务规则。
- 四应用分别：`node node_modules/vite/bin/vite.js build`，生产构建通过；Admin 保留 ECharts/Element/编辑器大于 500 kB chunk 的既有警告。没有调大阈值掩盖。
- `git diff --check` 通过。四站 `@shared`/jsconfig、Vue dedupe、共享目录开发访问范围已核对；共享目录继续作为相邻源码依赖，不创建独立 npm 包。

浏览器使用 Playwright 技能。npx 可用、Playwright CLI 未安装，复用本地运行时已安装 Playwright 库和 Chrome，未下载浏览器/依赖。四站以生产 preview 运行在 127.0.0.1:5291–5294，全部 API 由 route.fulfill 控制，外部资源阻断、WS 使用受控模拟，未调用生产写接口。执行 `node validation.local/quality/browser.mjs`：

- Admin：详情失败不能保存；Ctrl+S 连续保存共用请求，期间继续输入保留脏状态；离页再次保存最新输入及同一 ID；Dashboard 排行 429 可独立重试。
- Blog：延迟访客初始化后挑战/写入带签名头；验证码完整字符串提交、429 保留正文并刷新挑战；键盘 Enter 可换题；确认链接首次失败保留参数，重试成功消费参数且 Hero 不丢；PUT 更换邮箱后等待确认，不误报已订阅。
- Home/CV：可选区 429 不清成功资料，重试只读失败区且发送签名头；凭据保存成功；可执行协议链接没有 href，保持首页。
- 最终四站无浏览器 pageerror。脚本 finally 关闭全部浏览器上下文及本轮四个 preview 子进程；回环 5291–5294 无遗留监听。

## Website 同步与边界

目标 `D:\CodingFiles\Blog\DriftingLeaves-Website` 下同名四应用及 Frontend-Shared。开始重新枚举 195 个映射文件，均与源相同；本轮新增模块/文档纳入最终清单。只按明确相对路径更新，源码、public、必要构建/编辑器配置、package/锁文件、测试和文档均在清单中；未镜像覆盖目录。

目标独有内容及范围外文件在同步前记录 SHA-256，收尾逐一核对；Backend（含三份独有安全方案）、DockerForDriftingLeaves、公共根文件和 Git 元数据/索引不修改。不复制 node_modules、dist、IDE、缓存、日志、validation.local、临时联接或本地环境配置。上一轮六个弃用文件在开始时两侧均已不存在，本轮不复活、不重复删除。

目标使用自身源码/配置运行 Node 回归和四次 Vite 构建；仅在缺少依赖时建立本轮可追踪的 node_modules 临时联接，验证后仅移除这些联接。目标构建输出位于源忽略目录 `validation.local/quality/website-builds/Frontend-*`。

目标根执行 `node --test Frontend-Admin/tests/frontend-regressions.test.mjs Frontend-Blog/tests/forms.test.js Frontend-Blog/tests/markdownAnchors.test.js`；各应用目录执行 `node D:\CodingFiles\Blog\DriftingLeavesOfFront\Frontend-X\node_modules\vite\bin\vite.js build --outDir D:\CodingFiles\Blog\DriftingLeavesOfFront\validation.local\quality\website-builds\Frontend-X`。目标 ESLint 也从目标应用目录执行上面相同参数，使用源已安装工具的绝对路径，检查的是目标 src 和 vite.config.js。

收尾记录：源与 Website 各 34 项 Node 回归全部通过，四应用非修复 ESLint 各 0 error/0 warning，源共享模块 ESLint 通过，两侧各四次生产构建通过（Admin 仍有上述大 chunk 警告）。最终重新枚举 199 个文件逐一 SHA-256 相同，本轮相对开始状态更新/新增 78 个文件，没有新增文件删除；372 个范围外保护文件哈希不变。四个临时 node_modules 联接已移除，源依赖目录仍在；本轮 preview 和测试进程已结束，5291–5294 无遗留监听。

本轮受控浏览器、同步与目标验证分别执行 `node validation.local/quality/browser.mjs`、`node validation.local/quality/sync.mjs sync`、`node validation.local/quality/website-validate.mjs`。工具脚本、日志、完整最终相对路径/哈希映射、保护基线和临时联接清理记录保留在源忽略目录 `validation.local/quality/`，未复制到 Website 或应用包。

## 未处理边界

未连接真实后端、MySQL/Redis、SMTP/OSS，未验证真实 WebSocket 101、代理/CORS/Cookie、生产签名鉴权或投递；受控浏览器只能证明前端交互。未执行部署迁移、全仓历史风格治理或移动设备逐屏验证。

快捷保存和“保存草稿”仍提交 isPublished=0；已发布稿是否撤稿保持未决定，不擅自改业务规则。前后端凭据/验证码/RSS/分页适配需配套发布，RSS 历史重复数据及环境配置仍按后端迁移文档处理。不同域名不新增跨域存储桥。
