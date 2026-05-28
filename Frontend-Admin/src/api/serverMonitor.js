import http from '@/utils/request'

/**
 * 获取服务器监测快照
 * @param {{
 *   diskResourceName?: string,
 *   networkResourceName?: string,
 *   diskIoResourceName?: string,
 *   limit?: number
 * }} params
 */
export const getServerMonitorSnapshot = (params) =>
  http.get('/admin/server-monitor/snapshot', { params })

/** 获取服务器监测概览 */
export const getServerMonitorOverview = () =>
  http.get('/admin/server-monitor/overview')

/** 获取负载详情 */
export const getServerMonitorLoad = () =>
  http.get('/admin/server-monitor/load')

/** 获取 CPU 详情 */
export const getServerMonitorCpu = () =>
  http.get('/admin/server-monitor/cpu')

/** 获取内存详情 */
export const getServerMonitorMemory = () =>
  http.get('/admin/server-monitor/memory')

/** 获取磁盘选项 */
export const getServerMonitorDiskOptions = () =>
  http.get('/admin/server-monitor/disk/options')

/**
 * 获取磁盘详情
 * @param {{ resourceName?: string }} params
 */
export const getServerMonitorDisk = (params) =>
  http.get('/admin/server-monitor/disk', { params })

/** 获取网卡选项 */
export const getServerMonitorNetworkOptions = () =>
  http.get('/admin/server-monitor/network/options')

/** 获取磁盘 IO 选项 */
export const getServerMonitorDiskIoOptions = () =>
  http.get('/admin/server-monitor/disk-io/options')

/**
 * 获取网络详情
 * @param {{ resourceName?: string, limit?: number }} params
 */
export const getServerMonitorNetwork = (params) =>
  http.get('/admin/server-monitor/network', { params })

/**
 * 获取磁盘 IO 详情
 * @param {{ resourceName?: string, limit?: number }} params
 */
export const getServerMonitorDiskIo = (params) =>
  http.get('/admin/server-monitor/disk-io', { params })
