import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPersonalInfo } from '@/api/personalInfo'
import { getBlogReport } from '@/api/report'
import { getCategories } from '@/api/category'
import { getTags } from '@/api/tag'
import { getMusicList } from '@/api/music'

/** 跨页面站点数据；init() 共享 Promise，保留成功模块并只重试失败项；局部失败通过 loadError/loaded 暴露。 */
export const useBlogStore = defineStore('blog', () => {
  const personalInfo = ref({})
  const report = ref({})
  const categories = ref([])
  const tags = ref([])
  const musics = ref([])
  const loaded = ref(false)
  const loadError = ref('')

  /* 通过 slug 反查分类 id */
  const getCategoryIdBySlug = (slug) => {
    const cat = categories.value.find((c) => c.slug === slug)
    return cat ? cat.id : null
  }

  /* 通过 slug 反查标签 id */
  const getTagIdBySlug = (slug) => {
    const tag = tags.value.find((t) => t.slug === slug)
    return tag ? tag.id : null
  }

  /* 通过 slug 取分类名 */
  const getCategoryNameBySlug = (slug) => {
    const cat = categories.value.find((c) => c.slug === slug)
    return cat ? cat.name : ''
  }

  /* 通过 slug 取分类描述 */
  const getCategoryDescBySlug = (slug) => {
    const cat = categories.value.find((c) => c.slug === slug)
    return cat ? cat.description || '' : ''
  }

  /* 通过 slug 取标签名 */
  const getTagNameBySlug = (slug) => {
    const tag = tags.value.find((t) => t.slug === slug)
    return tag ? tag.name : ''
  }

  let initPromise = null
  const initialized = new Set()
  const init = () => {
    if (initPromise) return initPromise
    const sources = [
      [personalInfo, getPersonalInfo, {}], [report, getBlogReport, {}],
      [categories, getCategories, []], [tags, getTags, []], [musics, getMusicList, []]
    ]
    initPromise = Promise.allSettled(sources.map(async ([target, fetch, fallback]) => {
      if (initialized.has(target)) return
      const res = await fetch()
      target.value = res.data.data ?? fallback
      initialized.add(target)
    })).then((results) => {
      loadError.value = results.some((result) => result.status === 'rejected') ? '部分站点数据加载失败' : ''
      loaded.value = initialized.size === sources.length
    }).finally(() => { initPromise = null })
    return initPromise
  }

  return {
    personalInfo,
    report,
    categories,
    tags,
    musics,
    loaded,
    loadError,
    init,
    getCategoryIdBySlug,
    getTagIdBySlug,
    getCategoryNameBySlug,
    getCategoryDescBySlug,
    getTagNameBySlug
  }
})
