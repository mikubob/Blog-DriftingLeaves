import request from '@/utils/request'

/** 获取已发布文章列表（分页） */
export const getArticlePage = (page = 1, pageSize = 10) =>
  request.get('/blog/article/page', { params: { page, pageSize } })

/** 根据 slug 获取文章详情 */
export const getArticleBySlug = (slug) =>
  request.get(`/blog/article/detail/${slug}`)

/** 根据分类ID获取文章列表（分页） */
export const getArticlesByCategory = (categoryId, page = 1, pageSize = 10) =>
  request.get(`/blog/article/category/${categoryId}`, {
    params: { page, pageSize }
  })

/** 获取文章归档（按年月分组） */
export const getArticleArchive = () => request.get('/blog/article/archive')

/** 文章搜索 */
export const searchArticles = (keyword, page = 1, pageSize = 10) =>
  request.get('/blog/article/search', { params: { keyword, page, pageSize } })

/** 获取站点热门文章（按浏览量） */
export const getSiteHotArticlesByView = () =>
  request.get('/blog/article/hot/site/view')

/** 获取站点热门文章（按点赞量） */
export const getSiteHotArticlesByLike = () =>
  request.get('/blog/article/hot/site/like')

/** 获取本月热门文章（按浏览量） */
export const getMonthHotArticlesByView = () =>
  request.get('/blog/article/hot/month/view')

/** 获取本月热门文章（按点赞量） */
export const getMonthHotArticlesByLike = () =>
  request.get('/blog/article/hot/month/like')
