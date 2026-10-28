import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategories,
  getTagList,
  createTag,
  updateTag,
  deleteTags
} from '@/api/category'

/** 分类/标签共享列表与变更后刷新；两类读取各自只应用最新响应，共享 loading 等待全部读取。变更失败向页面传播。 */
export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const tags = ref([])
  const pendingCount = ref(0)
  const loading = computed(() => pendingCount.value > 0)

  let fetchCategoriesToken = 0
  const fetchCategories = async () => {
    const token = ++fetchCategoriesToken
    pendingCount.value++
    try {
      const res = await getCategoryList()
      if (token !== fetchCategoriesToken) return
      categories.value = res.data || []
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      pendingCount.value--
    }
  }

  let fetchTagsToken = 0
  const fetchTags = async () => {
    const token = ++fetchTagsToken
    pendingCount.value++
    try {
      const res = await getTagList()
      if (token !== fetchTagsToken) return
      tags.value = res.data || []
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      pendingCount.value--
    }
  }

  const addCategory = async (data) => {
    await createCategory(data)
    await fetchCategories()
  }

  const editCategory = async (data) => {
    await updateCategory(data)
    await fetchCategories()
  }

  const removeCategories = async (ids) => {
    await deleteCategories(ids)
    await fetchCategories()
  }

  const addTag = async (data) => {
    await createTag(data)
    await fetchTags()
  }

  const editTag = async (data) => {
    await updateTag(data)
    await fetchTags()
  }

  const removeTags = async (ids) => {
    await deleteTags(ids)
    await fetchTags()
  }

  /** 新建或更新分类（有 id 则更新，无则新建） */
  const saveCategory = (data) =>
    data.id ? editCategory(data) : addCategory(data)

  /** 新建或更新标签（有 id 则更新，无则新建） */
  const saveTag = (data) => (data.id ? editTag(data) : addTag(data))

  return {
    categories,
    tags,
    loading,
    fetchCategories,
    fetchTags,
    saveCategory,
    removeCategories,
    saveTag,
    removeTags
  }
})
