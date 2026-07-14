import axios from 'axios'
import router from '@/router'

const baseURL = '/api'

const instance = axios.create({
  baseURL,
  timeout: 15000
})

instance.interceptors.response.use(
  (res) => {
    if (res.data.code === 1) {
      return res
    }
    return Promise.reject(res.data)
  },
  (err) => {
    if (err?.response?.status === 403) {
      // 将后端返回的错误消息存入 sessionStorage，供 403 页面展示
      const backendMsg = err?.response?.data?.msg
      if (backendMsg) {
        sessionStorage.setItem('403_msg', backendMsg)
      }
      router.replace('/403')
    }
    return Promise.reject(err)
  }
)

export default instance
export { baseURL }
