import http from '@/utils/request'

/**
 * 总览数据（总浏览/访客/文章/评论等）
 * @param {import('axios').AxiosRequestConfig} [config] 可传 signal/silent
 * @returns {Promise<{code: number, data: object}>} 管理端 Result；失败拒绝
 */
export const getOverview = (config) => http.get('/admin/report/overview', config)

/**
 * 浏览量趋势统计
 * @param {{ begin: string, end: string }} params  yyyy-MM-dd 格式
 */
export const getViewStatistics = (params, config) =>
  http.get('/admin/report/viewStatistics', { ...config, params })

/**
 * 访客趋势统计
 * @param {{ begin: string, end: string }} params
 */
export const getVisitorStatistics = (params, config) =>
  http.get('/admin/report/visitorStatistics', { ...config, params })

/**
 * 访客省份分布
 */
export const getProvinceDistribution = (config) =>
  http.get('/admin/report/provinceDistribution', config)

/**
 * 文章访问量 TOP 10
 */
export const getArticleViewTop10 = (config) =>
  http.get('/admin/report/articleViewTop10', config)
