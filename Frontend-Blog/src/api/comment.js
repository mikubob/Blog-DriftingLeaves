import request from '@/utils/request'
/** 根节点分页；Result.data 为 PageResult，records 含各根的可见 children/isOwn/avatarUrl。返回 AxiosResponse，失败拒绝。 */
export const getCommentTree = (articleId, page = 1, pageSize = 10) =>
  request.get(`/blog/articleComment/article/${articleId}/page`, { params: { page, pageSize } })
/** 以当前签名访客提交；data 含 articleId/parentId、captchaId 和完整字符串 captchaAnswer，不推导 rootId。 */
export const submitComment = (data) => request.post('/blog/articleComment', data)
/** 修改本人的内容和 isMarkdown；成功后重新审核，调用者刷新树。 */
export const editComment = (data) => request.put('/blog/articleComment/edit', data)
/** 删除本人节点，线程级联规则由后端决定；返回 AxiosResponse。 */
export const deleteComment = (id) => request.delete(`/blog/articleComment/${id}`)
