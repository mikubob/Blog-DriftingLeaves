/** 从 Result 或 Axios 错误提取用户提示；不改变传给调用者的原始错误。 */
export const errorMessage = (error) =>
  error?.response?.data?.msg || error?.msg || '网络或服务异常，请稍后重试'

/**
 * 安装公开三站的凭据与错误出口；成功仍返回 AxiosResponse，失败拒绝原错误。
 * 401 只使本次请求使用的凭据失效；record 可无凭据重试一次，写请求不自动重放。
 * silent/取消请求不提示，403 进入受限页，429 保留当前页面与输入。
 * @param {import('axios').AxiosInstance} client 每站独立且只安装一次的实例
 * @param {import('vue-router').Router} router
 * @param {(message: string) => void} notify
 * @param {{getVisitorToken: Function, setVisitorToken: Function}} session
 */
export function installPublicResponses(client, router, notify, session) {
  client.interceptors.request.use((config) => {
    const token = session.getVisitorToken()
    if (token) config.headers.set('X-Visitor-Token', token)
    return config
  })
  const fail = (error, config) => {
    if (!config?.silent && error.code !== 'ERR_CANCELED')
      notify(errorMessage(error))
    return Promise.reject(error)
  }
  client.interceptors.response.use(
    (res) => {
      if (res.data.code === 1) return res
      return fail(res.data, res.config)
    },
    (error) => {
      const status = error.response?.status
      const sentToken = error.config?.headers?.get('X-Visitor-Token')
      if (status === 401 && sentToken && sentToken === session.getVisitorToken()) {
        session.setVisitorToken('')
        if (
          error.config?.url?.endsWith('/visitor/record') &&
          !error.config._visitorRetry
        ) {
          error.config._visitorRetry = true
          error.config.headers.delete('X-Visitor-Token')
          return client(error.config)
        }
        window.dispatchEvent(new Event('visitor-session-expired'))
      }
      if (status === 403 && !error.config?.silent) {
        sessionStorage.setItem('403_msg', errorMessage(error))
        router.replace('/403')
        return Promise.reject(error)
      }
      return fail(error, error.config)
    }
  )
}
