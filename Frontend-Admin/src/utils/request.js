import axios from 'axios'
import router from '@/router'

const baseURL = '/api'

/**
 * Axios 实例
 * 启用 withCredentials，让浏览器自动携带后端下发的 Cookie（含 HttpOnly Token）
 */
const http = axios.create({
  baseURL,
  timeout: 300000,
  withCredentials: true
})

http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  (response) => {
    const { data, config } = response
    if (data?.code === 1) {
      return data
    }
    if (!config?.silent) {
      ElMessage.error(data?.msg || '请求失败')
    }
    return Promise.reject(data)
  },
  (error) => {
    const status = error?.response?.status
    const silent = error?.config?.silent
    if (status === 401) {
      // 静默模式下不提示、不跳转
      if (silent) {
        return Promise.reject(error)
      }
      // 防止多个并发请求同时 401 弹出多个提示
      if (!http._isRedirecting401) {
        http._isRedirecting401 = true
        ElMessage.warning('登录状态失效，请重新登录')
        router.push('/login')
        setTimeout(() => {
          http._isRedirecting401 = false
        }, 2000)
      }
    } else if (status === 403) {
      const backendMsg = error?.response?.data?.msg
      if (backendMsg) {
        ElMessage.error(backendMsg)
      }
      ElMessage.error('权限不足，无法执行该操作')
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default http
export { baseURL }
