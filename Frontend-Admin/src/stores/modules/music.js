import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getMusicPage,
  createMusic,
  updateMusic,
} from '@/api/music'

/** 音乐分页状态与创建/更新分流；只接收最新读取，失败保留成功数据；保存失败传播，页面决定刷新页码。 */
export const useMusicStore = defineStore('music', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)

  let fetchListToken = 0
  /**
   * @param {{ page: number, pageSize: number, title?: string }} query
   */
  const fetchList = async (query) => {
    const token = ++fetchListToken
    loading.value = true
    try {
      const res = await getMusicPage(query)
      if (token !== fetchListToken) return
      list.value = res.data?.records ?? []
      total.value = res.data?.total ?? 0
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      if (token === fetchListToken) loading.value = false
    }
  }

  const saveMusic = async (data) => {
    if (data.id) {
      await updateMusic(data)
    } else {
      await createMusic(data)
    }
  }

  return { list, total, loading, fetchList, saveMusic }
})
