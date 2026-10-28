import request from '@/utils/request'

/** 获取个人信息 */
export const getPersonalInfo = (config) => request.get('/home/personalInfo', config)
