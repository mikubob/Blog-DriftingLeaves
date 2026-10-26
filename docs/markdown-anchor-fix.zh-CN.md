# Markdown 目录跳转修复

## 问题原因

截图中的目录链接使用常见的 Markdown 标题锚点，例如：

```markdown
- [2.1 数值类型](#21-数值类型)

### 2.1 数值类型
```

1. 管理端 `MdEditor` 和博客端 `MdPreview` 没有配置 `mdHeadingId`。项目安装的 md-editor-v3 6.3.1 默认直接使用标题文本作为 ID，即 `2.1 数值类型`，与链接的 `21-数值类型` 不一致。
2. 后端 CommonMark 默认只输出标题标签，没有生成标题 ID；Jsoup 原有白名单又会移除标题 ID 和 `href="#..."`。后端转换及过滤后的 HTML 因而无法完整保留目录锚点。
3. 博客侧边栏以前直接保存标题 DOM 引用并滚动，使用的 `toc-heading-N` 仅是列表内部标识，与正文目录链接没有关联。侧边栏能滚动不代表正文目录正常。

## 修改内容

- 两个前端使用相同的标题规则：小写、保留中英文及数字、删除标点、空白转为连字符；空标题使用 `section`。例如 `2.4 JSON 类型` 生成 `24-json-类型`。
- 同一篇文章中的重复标题依次追加 `-1`、`-2`，同时处理标题本身带数字后缀造成的碰撞；编辑器重新渲染时重置计数。
- 使用 md-editor-v3 官方 `mdHeadingId` 扩展点，不修改依赖源码。管理端预览点击后滚动编辑器中的目标位置，不改变编辑页面地址。
- 博客正文目录支持中文及百分号编码锚点、固定页头偏移、带锚点地址的首次加载与刷新。缺失目标和非法编码不会引发异常。
- HTML 回退内容会为没有 ID 的 h1–h6 补齐 ID，保留已有自定义 ID；侧边栏同样读取真实 ID，并包含五、六级标题。
- 后端 Markdown 转换和 HTML 过滤使用同样的标题规则；保留标题 ID、显式命名锚点及页内链接，继续移除脚本、事件属性与危险 URL 协议。
- 新增和编辑文章时，前端提交的 HTML 也经过上述过滤及锚点补全流程。

## 验证

前端回归测试（Node.js 22 或更新版本）：

```powershell
node --test Frontend-Blog/tests/markdownAnchors.test.js
```

后端回归测试（在 Backend 目录执行，JDK 21 / Maven）：

```powershell
mvn -pl DL-server -am "-Dtest=MarkdownUtilTest" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

已验证管理端和博客端生产构建、前端 4 项测试、后端 4 项测试，并通过真实 Chrome 检查正文目录、重复标题、刷新定位、侧边栏、h1–h6、旧 HTML、移动端编码深链接及编辑器内部滚动。浏览器验证使用模拟接口数据，不依赖生产数据库。

## 现有文章

有 Markdown 源文的文章会在新版博客中自动按新规则渲染，无需修改数据库。HTML 回退文章中缺失的标题 ID 会自动补齐。如果旧数据中的目录 `href` 已经被历史过滤删除，则需要从保留的 Markdown 重新保存文章；已经丢失的链接目标无法仅靠纯 HTML 自动还原。

本次没有修改生产数据库或部署线上服务。上线时需重新构建前端并重启更新后的后端；若服务仍命中旧文章 HTML 缓存，可在后台重新保存对应文章，触发现有缓存失效逻辑。

## 参考

- [md-editor-v3 官方项目](https://github.com/imzbf/md-editor-v3) 及 [mdHeadingId API](https://imzbf.github.io/md-editor-v3/en-US/api/)：通过公开扩展点配置标题 ID。
- [github-slugger](https://github.com/Flet/github-slugger)：参考标题 slug 和重复标题去重思路；本次没有新增 npm 依赖，使用与后端一致、覆盖中英文技术标题的规则，并不宣称完整复刻 GitHub 的全部 Unicode 规则。
- [CommonMark Java](https://github.com/commonmark/commonmark-java)：确认默认标题渲染与标题锚点属于不同能力。
- [Jsoup Safelist](https://jsoup.org/apidocs/org/jsoup/safety/Safelist)：使用 `addProtocols("a", "href", "#")` 保留页内链接。
