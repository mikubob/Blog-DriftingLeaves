import request from '@/utils/request'
/** 首次订阅发送确认邮件；成功 AxiosResponse 不表示已订阅，状态以 checkSubscription 为准。 */
export const addSubscription = (data) => request.post('/blog/rssSubscription', data)
/** 更新 {nickname,email}；换邮箱重新确认，同邮箱昵称更新由当前签名访客授权。 */
export const updateSubscription = (data) => request.put('/blog/rssSubscription', data)
/** 消费邮箱确认票据，需发起访客的签名凭据；失败保留 URL 参数供重试。 */
export const confirmSubscription = (token) => request.post('/blog/rssSubscription/confirm', null, { params: { token } })
/** 使用邮件/状态接口的退订票据，重复调用幂等；不以邮箱或 visitorId 授权。 */
export const unsubscribe = (token) => request.put('/blog/rssSubscription/unsubscribe', null, { params: { token } })
/** 返回 AxiosResponse，data.data 含 subscribed/nickname/email/unsubscribeToken；失败拒绝原错误。 */
export const checkSubscription = () => request.get('/blog/rssSubscription/check')
