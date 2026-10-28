/** 新建评论/留言的局部表单默认值；不恢复授权身份。 */
export const discussionDefaults = (nickname = '', emailOrQq = '') => ({
  nickname, emailOrQq, content: '', captchaAnswer: '',
  isSecret: false, isNotice: true, isMarkdown: true
})
/** 返回独立校验状态，避免两个表单共享可变对象。 */
export const discussionErrors = () => ({ nickname: '', emailOrQq: '', content: '', captcha: '' })
/** 格式化后端 ISO 日期为分钟精度的展示文本。 */
export const fmtDiscussionDate = (date) => date ? date.slice(0, 16).replace('T', ' ') : ''
/** 仅消费公开头像字段；不从访客联系方式推导头像。 */
export const discussionAvatar = (item, info) => item.isAdminReply ? info?.avatar || '' : item.avatarUrl || ''
/** 无头像时显示昵称首字母。 */
export const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?'
