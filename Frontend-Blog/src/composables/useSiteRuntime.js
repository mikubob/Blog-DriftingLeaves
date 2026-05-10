import { ref } from 'vue'
import { getConfigByKey } from '@/api/systemConfig'

export const useSiteRuntime = () => {
  const runDays = ref(null)

  const fetchRunDays = async () => {
    try {
      const res = await getConfigByKey('start-time')
      const startTime = res?.data?.data?.configValue || ''
      if (!startTime) return

      const startDate = new Date(startTime)
      if (Number.isNaN(startDate.getTime())) return

      const diffDays = Math.floor(
        (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      )
      runDays.value = Math.max(diffDays, 0)
    } catch {
      /* ignore */
    }
  }

  return {
    runDays,
    fetchRunDays
  }
}
