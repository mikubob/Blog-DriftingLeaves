import request from '@/utils/request'
/** 记录浏览器信息；返回含 visitorToken 的 AxiosResponse，凭据保存由 composable 负责。 */
export const recordVisitor = (data, config) => request.post('/home/visitor/record', data, config)
