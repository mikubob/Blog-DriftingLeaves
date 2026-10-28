import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getFriendLinkList,
  createFriendLink,
  updateFriendLink,
  deleteFriendLinks
} from '@/api/friendLink'

/** 友链列表与变更后刷新；只接收最新读取响应，读取失败保留成功数据；变更失败向页面传播。 */
export const useFriendLinkStore = defineStore('friendLink', () => {
  const list = ref([])
  const loading = ref(false)

  let fetchListToken = 0
  /** 拉取所有友情链接 */
  const fetchList = async () => {
    const token = ++fetchListToken
    loading.value = true
    try {
      const res = await getFriendLinkList()
      if (token !== fetchListToken) return
      list.value = res.data ?? []
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      if (token === fetchListToken) loading.value = false
    }
  }

  /**
   * 保存友情链接（有 id 则更新，无 id 则新建）
   * @param {Object} data
   */
  const saveFriendLink = async (data) => {
    if (data.id) {
      await updateFriendLink(data)
    } else {
      await createFriendLink(data)
    }
    await fetchList()
  }

  /**
   * 批量删除
   * @param {number[]} ids
   */
  const removeFriendLinks = async (ids) => {
    await deleteFriendLinks(ids)
    await fetchList()
  }

  return { list, loading, fetchList, saveFriendLink, removeFriendLinks }
})
