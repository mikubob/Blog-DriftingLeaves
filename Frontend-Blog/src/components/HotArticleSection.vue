<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  getMonthHotArticlesByLike,
  getMonthHotArticlesByView,
  getSiteHotArticlesByLike,
  getSiteHotArticlesByView
} from '@/api/article'
import ArticleCard from '@/components/ArticleCard.vue'

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

const leadArticle = computed(() => hotArticles.value[0] ?? null)
const restArticles = computed(() => hotArticles.value.slice(1, 5))
const scopeLabel = computed(() =>
  activeScope.value === 'site' ? '全站' : '本月'
)
const metricLabel = computed(() =>
  activeMetric.value === 'view' ? '浏览量' : '点赞量'
)
const metricIcon = computed(() =>
  activeMetric.value === 'view' ? 'icon-eye' : 'icon-dianzan'
)
const metricSummary = computed(() =>
  activeMetric.value === 'view' ? '按阅读热度排序' : '按点赞热度排序'
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

watch([activeScope, activeMetric], loadHotArticles)

onMounted(loadHotArticles)
</script>

<template>
  <section class="hot-section">
    <div class="hot-header">
      <div class="hot-heading">
        <p class="hot-kicker">Curated Ranking</p>
        <div class="hot-title-row hot-title-badge">
          <span class="hot-title-icon">🔥</span>
          <h2 class="hot-title">热门文章</h2>
          <span class="hot-title-sparkle">✦</span>
          <span class="hot-title-note">
            {{ scopeLabel }} · 按 {{ metricLabel }} 排序
          </span>
        </div>
      </div>

      <div class="hot-controls">
        <div class="hot-switch hot-switch-scope">
          <button
            v-for="option in scopeOptions"
            :key="option.value"
            type="button"
            class="hot-switch-btn"
            :class="{ active: activeScope === option.value }"
            @click="activeScope = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="hot-switch hot-switch-metric">
          <button
            v-for="option in metricOptions"
            :key="option.value"
            type="button"
            class="hot-switch-btn"
            :class="{ active: activeMetric === option.value }"
            @click="activeMetric = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="hot-skeleton">
      <div class="hot-skeleton-lead" />
      <div class="hot-skeleton-list">
        <div v-for="i in 4" :key="i" class="hot-skeleton-item" />
      </div>
    </div>

    <div v-else-if="leadArticle" class="hot-grid">
      <div class="hot-lead-wrap">
        <div class="hot-lead-intro">
          <div class="hot-badge">
            <span class="hot-rank">TOP 1</span>
            <span class="hot-metric">
              <i class="iconfont" :class="metricIcon" />
              {{ leadArticle.hotValue ?? 0 }}
            </span>
          </div>
          <p class="hot-lead-note">
            {{ scopeLabel }}热门文章中的第一名，{{ metricSummary }}
          </p>
        </div>
        <ArticleCard :article="leadArticle" class="hot-lead-card" />
      </div>

      <div class="hot-list">
        <router-link
          v-for="(article, index) in restArticles"
          :key="article.id"
          :to="`/article/${article.slug}`"
          class="hot-item"
        >
          <div class="hot-item-head">
            <div class="hot-item-rank">
              TOP {{ index + 2 }}
            </div>
            <span class="hot-item-score">
              <i class="iconfont" :class="metricIcon" />
              {{ article.hotValue ?? 0 }}
            </span>
          </div>
          <div class="hot-item-body">
            <p v-if="article.categoryName" class="hot-item-category">
              {{ article.categoryName }}
            </p>
            <h4 class="hot-item-title">{{ article.title }}</h4>
            <p v-if="article.summary" class="hot-item-summary">
              {{ article.summary }}
            </p>
            <div class="hot-item-meta">
              <span><i class="iconfont icon-time" /> {{ fmtDate(article.publishTime) }}</span>
              <span><i class="iconfont icon-eye" /> {{ article.viewCount ?? 0 }}</span>
              <span><i class="iconfont icon-dianzan" /> {{ article.likeCount ?? 0 }}</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <div v-else class="hot-empty">暂无热门文章</div>
  </section>
</template>

<style scoped>
.hot-section {
  position: relative;
  margin-bottom: 18px;
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.98)),
    var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.hot-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(48, 49, 51, 0.015),
    transparent 16%,
    transparent 84%,
    rgba(48, 49, 51, 0.015)
  );
  pointer-events: none;
  opacity: 1;
}

.hot-header,
.hot-grid,
.hot-empty,
.hot-skeleton {
  position: relative;
  z-index: 1;
}

.hot-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(48, 49, 51, 0.1);
}

.hot-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--blog-text3);
}

.hot-title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.hot-title-badge {
  align-items: center;
  gap: 8px;
}

.hot-title-icon,
.hot-title-sparkle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  user-select: none;
}

.hot-title-icon {
  font-size: 24px;
  transform: translateY(-1px);
}

.hot-title-sparkle {
  font-size: 14px;
  color: #a78bfa;
  opacity: 0.8;
}

.hot-title {
  margin: 0;
  font-size: 25px;
  line-height: 1.1;
  font-family: var(--blog-serif);
  color: var(--blog-text);
}

.hot-title-note {
  font-size: 12px;
  color: var(--blog-text3);
}

.hot-switch {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  background: var(--blog-hover);
  border-radius: 999px;
  border: 1px solid var(--blog-border-light);
}

.hot-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hot-switch-scope .hot-switch-btn {
  min-width: 62px;
}

.hot-switch-metric .hot-switch-btn {
  min-width: 92px;
}

.hot-switch-btn {
  border: none;
  background: transparent;
  color: var(--blog-text2);
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.hot-switch-btn.active {
  background: var(--blog-card);
  color: var(--blog-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.hot-switch-btn:hover {
  color: var(--blog-text);
}

.hot-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hot-lead-wrap {
  padding: 10px;
  border-radius: 12px;
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
}

.hot-lead-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.hot-lead-note {
  margin: 0;
  font-size: 13px;
  color: var(--blog-text2);
}

.hot-lead-card {
  margin-bottom: 0;
}

.hot-badge {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.hot-rank {
  font-family: var(--blog-serif);
  font-size: 17px;
  line-height: 1;
  color: var(--blog-text);
  letter-spacing: 0.08em;
}

.hot-metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--blog-hover);
  color: var(--blog-text2);
  font-size: 12px;
}

.hot-item-category {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--blog-text3);
}

.hot-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--blog-text3);
  font-size: 12px;
}

.hot-item-meta .iconfont {
  font-size: 12px;
  margin-right: 3px;
}

.hot-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hot-item {
  display: block;
  position: relative;
  padding: 15px;
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 12px;
  color: inherit;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.hot-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.05);
  border-color: #d5d8df;
}

.hot-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.hot-item-rank {
  font-family: var(--blog-serif);
  font-size: 14px;
  color: var(--blog-text3);
  letter-spacing: 0.08em;
}

.hot-item-body {
  min-width: 0;
  flex: 1;
}

.hot-item-title {
  margin: 0 0 8px;
  color: var(--blog-text);
  font-size: 16px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hot-item-summary {
  margin: 0 0 10px;
  color: var(--blog-text2);
  font-size: 13px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hot-item-score {
  color: var(--blog-text2);
  font-size: 12px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f7f8fb;
}

.hot-empty {
  padding: 36px 0 20px;
  text-align: center;
  color: var(--blog-text3);
  font-size: 14px;
}

.hot-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-skeleton-lead,
.hot-skeleton-item {
  background: linear-gradient(90deg, #f1f3f6 25%, #fafbfc 37%, #f1f3f6 63%);
  background-size: 400% 100%;
  animation: hot-loading 1.4s ease infinite;
  border-radius: 8px;
  border: 1px solid var(--blog-border-light);
}

.hot-skeleton-lead {
  min-height: 260px;
}

.hot-skeleton-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.hot-skeleton-item {
  min-height: 180px;
}

@keyframes hot-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (max-width: 960px) {
  .hot-list,
  .hot-skeleton-list {
    grid-template-columns: 1fr;
  }

  .hot-lead-intro {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .hot-section {
    padding: 14px;
  }

  .hot-header {
    align-items: stretch;
    flex-direction: column;
  }

  .hot-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .hot-switch {
    width: 100%;
    justify-content: space-between;
  }

  .hot-switch-btn {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .hot-title {
    font-size: 22px;
  }

  .hot-item {
    padding: 14px;
  }
}
</style>
