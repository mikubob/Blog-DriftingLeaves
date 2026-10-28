import request from '@/utils/request'
/** 根节点分页；Result.data.records 为根及其可见回复，total 按根计数；成功保留 AxiosResponse。 */
export const getMessageTree = (page = 1, pageSize = 10) =>
  request.get('/blog/message/page', { params: { page, pageSize } })
/** 当前签名访客创建；data 带 captchaId、完整字符串 captchaAnswer 和可选 parentId。失败拒绝原错误。 */
export const submitMessage = (data) => request.post('/blog/message', data)
/** 编辑内容/格式后重新审核；不额外要求验证码，调用者成功后刷新树。 */
export const editMessage = (data) => request.put('/blog/message/edit', data)
/** 删除本人节点；级联和归属鉴权由后端负责。 */
export const deleteMessage = (id) => request.delete(`/blog/message/${id}`)
