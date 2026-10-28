import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getArticlePage,
  createArticle,
  updateArticle
} from '@/api/article'
import { getCategoryList, getTagList } from '@/api/category'

/** 文章列表、编辑选项与创建/更新协调；列表只应用最新响应，读取失败保留成功数据。保存失败向页面传播，创建成功返回新 ID。 */
export const useArticleStore = defineStore('article', () => {
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)
  const categories = ref([])
  const tags = ref([])

  let fetchListToken = 0
  /**
   * 分页拉取文章列表
   * @param {{ page: number, pageSize: number, title?: string, categoryId?: number, isPublished?: number }} query
   */
  const fetchList = async (query) => {
    const token = ++fetchListToken
    loading.value = true
    try {
      const res = await getArticlePage(query)
      if (token !== fetchListToken) return
      list.value = res.data?.records || []
      total.value = res.data?.total || 0
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      if (token === fetchListToken) loading.value = false
    }
  }

  /** 拉取所有分类（用于下拉选择） */
  const fetchCategories = async () => {
    const res = await getCategoryList()
    categories.value = res.data || []
  }

  /** 拉取所有标签 */
  const fetchTags = async () => {
    const res = await getTagList()
    tags.value = res.data || []
  }

  /**
   * 保存文章（创建或更新）
   * @param {Object} data
   * @returns {Promise<object>} 原始 Result，创建时 data 为新 ID；失败拒绝
   */
  const saveArticle = async (data) => {
    if (data.id) {
      return updateArticle(data)
    } else {
      return createArticle(data)
    }
  }

  return {
    list,
    total,
    loading,
    categories,
    tags,
    fetchList,
    fetchCategories,
    fetchTags,
    saveArticle
  }
})
