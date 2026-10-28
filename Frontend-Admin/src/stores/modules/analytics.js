import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRssPage } from '@/api/rssSubscription'
import { getViewRecordPage } from '@/api/viewRecord'

/** analytics 页面共享列表状态；只应用最新读取响应，失败由请求层提示并保留上次成功数据。变更直接使用 API，由页面负责刷新。 */
export const useAnalyticsStore = defineStore('analytics', () => {
  /* ---- RSS Subscription ---- */
  const rssList = ref([])
  const rssTotal = ref(0)
  const rssLoading = ref(false)

  let fetchRssListToken = 0
  /** @param {{ page: number, pageSize: number }} query */
  const fetchRssList = async (query) => {
    const token = ++fetchRssListToken
    rssLoading.value = true
    try {
      const res = await getRssPage(query)
      if (token !== fetchRssListToken) return
      rssList.value = res.data?.records ?? []
      rssTotal.value = res.data?.total ?? 0
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      if (token === fetchRssListToken) rssLoading.value = false
    }
  }

  /* ---- View Records ---- */
  const viewList = ref([])
  const viewTotal = ref(0)
  const viewLoading = ref(false)

  let fetchViewListToken = 0
  /** @param {{ page: number, pageSize: number }} query */
  const fetchViewList = async (query) => {
    const token = ++fetchViewListToken
    viewLoading.value = true
    try {
      const res = await getViewRecordPage(query)
      if (token !== fetchViewListToken) return
      viewList.value = res.data?.records ?? []
      viewTotal.value = res.data?.total ?? 0
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      if (token === fetchViewListToken) viewLoading.value = false
    }
  }

  return {
    rssList,
    rssTotal,
    rssLoading,
    fetchRssList,
    viewList,
    viewTotal,
    viewLoading,
    fetchViewList,
  }
})
