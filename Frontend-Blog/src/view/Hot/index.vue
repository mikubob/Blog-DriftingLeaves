<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getMonthHotArticlesByLike,
  getMonthHotArticlesByView,
  getSiteHotArticlesByLike,
  getSiteHotArticlesByView
} from '@/api/article'
import SidebarCard from '@/components/SidebarCard.vue'

const router = useRouter()
const { articleTitle, articleMeta } = inject('setHero')

const activeScope = ref('site')
const activeMetric = ref('view')
const hotArticles = ref([])
const loading = ref(false)

const scopeOptions = [
  { label: '全站', value: 'site' },
  { label: '本月', value: 'month' }
]

const metricOptions = [
  { label: '浏览热榜', value: 'view' },
  { label: '点赞热榜', value: 'like' }
]

const scopeLabel = computed(() =>
  activeScope.value === 'site' ? '全站' : '本月'
)
const metricLabel = computed(() =>
  activeMetric.value === 'view' ? '浏览量' : '点赞量'
)
const metricIcon = computed(() =>
  activeMetric.value === 'view' ? 'icon-eye' : 'icon-dianzan'
)

const fmtDate = (d) => (d ? d.slice(0, 10).replace('T', ' ') : '')

const loadHotArticles = async () => {
  loading.value = true
  try {
    const apiMap = {
      site: {
        view: getSiteHotArticlesByView,
        like: getSiteHotArticlesByLike
      },
      month: {
        view: getMonthHotArticlesByView,
        like: getMonthHotArticlesByLike
      }
    }
    const api = apiMap[activeScope.value][activeMetric.value]
    const res = await api()
    hotArticles.value = res.data.data ?? []
  } catch {
    hotArticles.value = []
  } finally {
    loading.value = false
  }
}

const goArticle = (slug) => router.push(`/article/${slug}`)

watch([activeScope, activeMetric], loadHotArticles)

onMounted(() => {
  articleTitle.value = '热门文章'
  articleMeta.value = `${scopeLabel.value} · 按 ${metricLabel.value} 排序`
  loadHotArticles()
})
</script>

<template>
  <div class="hot-page">
    <div class="hot-layout">
      <div class="hot-main">
        <div class="content-card">
          <div class="card-header">
            <div class="header-left">
              <span class="header-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </span>
              <span class="header-title">热门文章</span>
              <span class="header-note">{{ scopeLabel }} · 按 {{ metricLabel }} 排序</span>
            </div>
            <div class="header-controls">
              <div class="hot-switch">
                <button
                  v-for="option in scopeOptions"
                  :key="option.value"
                  type="button"
                  class="switch-btn"
                  :class="{ active: activeScope === option.value }"
                  @click="activeScope = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
              <div class="hot-switch">
                <button
                  v-for="option in metricOptions"
                  :key="option.value"
                  type="button"
                  class="switch-btn"
                  :class="{ active: activeMetric === option.value }"
                  @click="activeMetric = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="placeholder">
            <div v-for="i in 6" :key="i" class="sk-card">
              <div class="sk-rank" />
              <div class="sk-cover" />
              <div class="sk-content">
                <div class="sk-line sk-line-title" />
                <div class="sk-line sk-line-summary" />
                <div class="sk-line sk-line-meta" />
              </div>
            </div>
          </div>

          <div v-else-if="hotArticles.length" class="hot-list">
            <div
              v-for="(article, index) in hotArticles"
              :key="article.id"
              class="hot-item"
              :class="{ 'is-top': index < 3 }"
              @click="goArticle(article.slug)"
            >
              <div class="item-rank" :class="`rank-${index + 1}`">
                <span v-if="index < 3" class="rank-badge">{{ index + 1 }}</span>
                <span v-else class="rank-num">{{ index + 1 }}</span>
              </div>
              <div v-if="article.coverImage" class="item-cover">
                <img :src="article.coverImage" :alt="article.title" loading="lazy" />
              </div>
              <div class="item-content">
                <div class="item-head">
                  <span v-if="article.categoryName" class="item-category">
                    {{ article.categoryName }}
                  </span>
                  <span class="item-score">
                    <i class="iconfont" :class="metricIcon" />
                    {{ article.hotValue ?? 0 }}
                  </span>
                </div>
                <h3 class="item-title">{{ article.title }}</h3>
                <p v-if="article.summary" class="item-summary">
                  {{ article.summary }}
                </p>
                <div class="item-meta">
                  <span><i class="iconfont icon-time" /> {{ fmtDate(article.publishTime) }}</span>
                  <span><i class="iconfont icon-eye" /> {{ article.viewCount ?? 0 }}</span>
                  <span><i class="iconfont icon-dianzan" /> {{ article.likeCount ?? 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <p v-else class="empty">暂无热门文章</p>
        </div>
      </div>

      <SidebarCard />
    </div>
  </div>
</template>

<style scoped>
.hot-page {
  width: 100%;
}
.hot-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.hot-main {
  flex: 1;
  min-width: 0;
}

.content-card {
  background: var(--blog-card);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--blog-border-light);
  padding: 24px 28px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--blog-border-light);
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ff6b6b;
}
.header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--blog-text);
}
.header-note {
  font-size: 12px;
  color: var(--blog-text3);
}
.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.hot-switch {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: var(--blog-hover);
  border-radius: 999px;
  border: 1px solid var(--blog-border-light);
}
.switch-btn {
  border: none;
  background: transparent;
  color: var(--blog-text2);
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
}
.switch-btn.active {
  background: var(--blog-card);
  color: var(--blog-text);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.switch-btn:hover:not(.active) {
  color: var(--blog-text);
}

/* 骨架屏 */
.placeholder {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sk-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--blog-border-light);
  border-radius: 8px;
}
.sk-rank {
  width: 48px;
  height: 48px;
  background: linear-gradient(90deg, #f1f3f6 25%, #fafbfc 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: sk-loading 1.4s ease infinite;
  border-radius: 8px;
  flex-shrink: 0;
}
.sk-cover {
  width: 140px;
  height: 100px;
  background: linear-gradient(90deg, #f1f3f6 25%, #fafbfc 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: sk-loading 1.4s ease infinite;
  border-radius: 6px;
  flex-shrink: 0;
}
.sk-content {
  flex: 1;
  min-width: 0;
}
.sk-line {
  background: linear-gradient(90deg, #f1f3f6 25%, #fafbfc 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: sk-loading 1.4s ease infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}
.sk-line-title {
  height: 18px;
  width: 70%;
}
.sk-line-summary {
  height: 14px;
  width: 90%;
}
.sk-line-meta {
  height: 12px;
  width: 40%;
  margin-bottom: 0;
}
@keyframes sk-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* 文章列表 */
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hot-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
.hot-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  border-color: #d5d8df;
}
.hot-item.is-top {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
}

.item-rank {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  font-family: var(--blog-serif);
  font-weight: 700;
}
.rank-1 {
  background: #fdf2f2;
  color: #c0392b;
}
.rank-2 {
  background: #fef5eb;
  color: #d35400;
}
.rank-3 {
  background: #fffbeb;
  color: #b7950b;
}
.rank-badge {
  font-size: 20px;
  text-align: center;
  line-height: 1;
}
.rank-num {
  font-size: 18px;
  color: var(--blog-text3);
}

.item-cover {
  flex-shrink: 0;
  width: 140px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
}
.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.hot-item:hover .item-cover img {
  transform: scale(1.05);
}

.item-content {
  flex: 1;
  min-width: 0;
}
.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.item-category {
  font-size: 12px;
  color: var(--blog-text3);
  background: var(--blog-hover);
  padding: 2px 8px;
  border-radius: 4px;
}
.item-score {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--blog-text2);
  background: var(--blog-hover);
  padding: 3px 8px;
  border-radius: 999px;
}
.item-score .iconfont {
  font-size: 12px;
}
.item-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--blog-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-summary {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--blog-text2);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--blog-text3);
}
.item-meta .iconfont {
  font-size: 12px;
  margin-right: 2px;
}

.empty {
  text-align: center;
  color: var(--blog-text3);
  padding: 40px 0;
  font-size: 14px;
}

@media (max-width: 1220px) {
  .hot-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(236px, 280px);
    align-items: start;
  }
}

@media (max-width: 960px) {
  .hot-layout {
    flex-direction: column;
    display: flex;
  }
  .hot-main {
    width: 100%;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-controls {
    width: 100%;
  }
  .hot-switch {
    flex: 1;
  }
  .switch-btn {
    flex: 1;
    text-align: center;
  }
}

@media (max-width: 600px) {
  .content-card {
    padding: 16px;
  }
  .hot-item {
    flex-direction: column;
    gap: 12px;
  }
  .item-rank {
    width: 100%;
    height: auto;
    padding: 8px;
    flex-direction: row;
    gap: 8px;
  }
  .item-cover {
    width: 100%;
    height: 160px;
  }
}
</style>
