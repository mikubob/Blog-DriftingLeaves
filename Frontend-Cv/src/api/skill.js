import request from '@/utils/request'

/** 获取技能列表 */
export const getSkills = (config) => request.get('/cv/skill', config)
