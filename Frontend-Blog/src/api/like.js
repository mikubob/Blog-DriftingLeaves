import request from '@/utils/request'
/** 当前签名访客点赞；返回 AxiosResponse，失败拒绝且不在客户端预增计数。 */
export const likeArticle = (articleId) => request.post(`/blog/articleLike/${articleId}`)
/** 当前签名访客取消点赞；调用者成功后更新已确认状态。 */
export const unlikeArticle = (articleId) => request.delete(`/blog/articleLike/${articleId}`)
/** 读取本人点赞，成功 data.data 为布尔值；初始化/换凭据后需重新读取。 */
export const hasLiked = (articleId) => request.get(`/blog/articleLike/${articleId}`)
