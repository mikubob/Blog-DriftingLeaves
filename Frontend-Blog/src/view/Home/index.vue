<script setup>
import { defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticlePage, searchArticles } from '@/api/article'
import ArticleCard from '@/components/ArticleCard.vue'
import SidebarCard from '@/components/SidebarCard.vue'

const HomeTimeWidgets = defineAsyncComponent(
  () => import('@/components/HomeTimeWidgets.vue')
)

const route = useRoute()
const router = useRouter()

const articles = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 6
const loading = ref(false)
const searchKeyword = ref('')
const showTimeWidgets = ref(false)

let widgetMediaQuery = null
let widgetMediaQueryListener = null

const loadArticles = async () => {
  loading.value = true
  try {
    let res
    if (searchKeyword.value) {
      res = await searchArticles(searchKeyword.value, page.value, pageSize)
    } else {
      res = await getArticlePage(page.value, pageSize)
    }
    const data = res.data.data
    articles.value = data.records ?? []
    total.value = data.total ?? 0
  } catch {
    articles.value = []
  } finally {
    loading.value = false
  }
}

const handlePageChange = (currentPage) => {
  page.value = currentPage
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  () => route.query.search,
  (keyword) => {
    searchKeyword.value = keyword || ''
    page.value = 1
    loadArticles()
  }
)

onMounted(() => {
  searchKeyword.value = route.query.search || ''
  loadArticles()

  widgetMediaQuery = window.matchMedia('(min-width: 1221px)')
  showTimeWidgets.value = widgetMediaQuery.matches
  widgetMediaQueryListener = (event) => {
    showTimeWidgets.value = event.matches
  }
  widgetMediaQuery.addEventListener('change', widgetMediaQueryListener)
})

onUnmounted(() => {
  if (widgetMediaQuery && widgetMediaQueryListener) {
    widgetMediaQuery.removeEventListener('change', widgetMediaQueryListener)
  }
})
</script>

<template>
  <div class="home-page">
    <div class="home-content">
      <div v-if="showTimeWidgets" class="left-widget-col">
        <HomeTimeWidgets />
      </div>

      <div class="article-col">
        <div v-if="searchKeyword" class="search-result-tip">
          <span
            >搜索: <strong>{{ searchKeyword }}</strong></span
          >
          <span class="search-count">{{ total }} 篇结果</span>
          <a class="clear-search" @click="router.push('/')">&times; 清除</a>
        </div>

        <div v-if="loading" class="loading-placeholder">
          <div v-for="i in 4" :key="i" class="skeleton-card">
            <div class="skeleton-cover" />
            <div class="skeleton-body">
              <div class="skeleton-line w60" />
              <div class="skeleton-line w90" />
              <div class="skeleton-line w40" />
            </div>
          </div>
        </div>

        <template v-else-if="articles.length">
          <ArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
          />
          <div v-if="total > pageSize" class="pagination-wrap">
            <el-pagination
              :current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              background
              @current-change="handlePageChange"
            />
          </div>
        </template>

        <div v-else class="empty-tip">暂无文章</div>
      </div>

      <SidebarCard />
    </div>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

.home-content {
  display: grid;
  grid-template-columns: minmax(220px, 240px) minmax(0, 1fr) minmax(
      248px,
      280px
    );
  gap: 28px;
  align-items: flex-start;
}

.left-widget-col {
  min-width: 0;
  position: sticky;
  top: 74px;
  align-self: flex-start;
}

.article-col {
  min-width: 0;
}

.search-result-tip {
  padding: 12px 16px;
  font-size: 14px;
  color: #606266;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-count {
  color: #909399;
  font-size: 13px;
}

.clear-search {
  color: #303133;
  cursor: pointer;
  font-weight: 600;
  margin-left: auto;
}

.skeleton-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.skeleton-cover {
  width: 200px;
  height: 130px;
  background: #ebeef5;
  border-radius: 6px;
  flex-shrink: 0;
}

.skeleton-body {
  flex: 1;
}

.skeleton-line {
  height: 14px;
  background: #ebeef5;
  border-radius: 4px;
  margin-bottom: 10px;
}

.w60 {
  width: 60%;
}

.w90 {
  width: 90%;
}

.w40 {
  width: 40%;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.empty-tip {
  padding: 60px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

@media (max-width: 1440px) {
  .home-content {
    grid-template-columns: minmax(208px, 224px) minmax(0, 1fr) minmax(
        236px,
        264px
      );
    gap: 22px;
  }
}

@media (max-width: 1220px) {
  .home-content {
    grid-template-columns: minmax(0, 1fr) minmax(236px, 280px);
    grid-template-areas:
      'main right'
      'left right';
    align-items: start;
  }

  .article-col {
    grid-area: main;
  }

  .left-widget-col {
    grid-area: left;
    position: static;
  }

  :deep(.sidebar) {
    grid-area: right;
  }
}

@media (max-width: 960px) {
  .home-content {
    grid-template-columns: 1fr;
    grid-template-areas:
      'main'
      'left'
      'right';
  }
}

@media (max-width: 600px) {
  .search-result-tip {
    font-size: 13px;
    padding: 10px 12px;
  }

  .skeleton-card {
    flex-direction: column;
  }

  .skeleton-cover {
    width: 100%;
    height: 160px;
  }
}
</style>
