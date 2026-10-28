import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getOperationLogPage } from '@/api/operationLog'

/** operationLog 页面共享列表状态；只应用最新读取响应，失败由请求层提示并保留上次成功数据。变更直接使用 API，由页面负责刷新。 */
export const useOperationLogStore = defineStore('operationLog', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)

  let fetchListToken = 0
  /**
   * 分页查询操作日志
   * @param {{ page: number, pageSize: number, target?: string, operationType?: string }} query
   */
  const fetchList = async (query) => {
    const token = ++fetchListToken
    loading.value = true
    try {
      const res = await getOperationLogPage(query)
      if (token !== fetchListToken) return
      list.value = res.data?.records ?? []
      total.value = res.data?.total ?? 0
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      if (token === fetchListToken) loading.value = false
    }
  }

  return { list, total, loading, fetchList }
})
