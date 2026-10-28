/** 公开站请求入口：成功保留 AxiosResponse；签名访客头和 HTTP/业务失败统一由共享拦截器处理。 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import router from '@/router'
import { installPublicResponses } from '@shared/requestErrors.mjs'
import * as session from '@shared/visitorSession.mjs'

const baseURL = '/api'
const instance = axios.create({ baseURL, timeout: 15000, withCredentials: true })
installPublicResponses(instance, router, (message) => ElMessage.error(message), session)
export default instance
export { baseURL }
