import { ref, computed } from 'vue'
import { getConfigByKey } from '@/api/systemConfig'

const startTime = ref('')
let pending = null
/** 页脚/侧栏共用开始时间与在途读取；失败由请求层提示，后续调用可重试，不创建定时器。 */
export const useSiteRuntime = () => {
  const runDays = computed(() => {
    const start = new Date(startTime.value).getTime()
    return Number.isNaN(start) ? null : Math.max(0, Math.floor((Date.now() - start) / 86400000))
  })
  const fetchRunDays = () => {
    if (pending) return pending
    if (startTime.value) return Promise.resolve()
    pending = getConfigByKey('start-time').then((res) => {
      startTime.value = res.data.data?.configValue || ''
    }).catch(() => {}).finally(() => { pending = null })
    return pending
  }
  return { startTime, runDays, fetchRunDays }
}
