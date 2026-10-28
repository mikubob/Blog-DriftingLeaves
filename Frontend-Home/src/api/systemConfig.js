import request from '@/utils/request'

/** 获取系统配置信息 */
export const getSystemConfig = (configKey, config) =>
  request.get(`/home/systemConfig/key/${configKey}`, config)
