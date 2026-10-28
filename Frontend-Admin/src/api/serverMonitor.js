import http from '@/utils/request'

/**
 * 获取服务器监测快照
 * @param {{
 *   diskResourceName?: string,
 *   networkResourceName?: string,
 *   diskIoResourceName?: string,
 *   limit?: number
 * }} params
 * @param {import('axios').AxiosRequestConfig & {silent?: boolean}} [config] signal 取消读取；silent 由监控页展示错误
 * @returns {Promise<{code: number, data: object}>} 快照 Result，业务及 HTTP 失败拒绝
 */
export const getServerMonitorSnapshot = (params, config = {}) =>
  http.get('/admin/server-monitor/snapshot', { ...config, params })
