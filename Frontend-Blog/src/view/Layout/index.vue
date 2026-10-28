<script setup>
import { ref, provide, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmSubscription, unsubscribe } from '@/api/rss'
import BlogHeader from '@/components/BlogHeader.vue'
import BlogFooter from '@/components/BlogFooter.vue'
import HeroBanner from '@/components/HeroBanner.vue'
import { useBlogStore, useVisitorStore, useThemeStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const rssLinkError = ref('')
let active = true
let rssLinkBusy = false
/** 成功才消费邮件查询参数；失败保留重试，切换链接等待当前处理完成后接续。 */
const handleRssLink = async () => {
  const confirm = route.query.rssConfirm
  const cancel = route.query.rssUnsubscribe
  if (!active || rssLinkBusy || (!confirm && !cancel)) return
  rssLinkBusy = true
  rssLinkError.value = ''
  try {
    if (typeof confirm === 'string') {
      await visitorStore.record()
      if (!active) return
      await confirmSubscription(confirm)
      if (!active) return
      ElMessage.success('邮箱已确认，订阅已生效')
    } else if (typeof cancel === 'string') {
      try {
        await ElMessageBox.confirm('确认取消邮件订阅？', '邮件订阅', { type: 'warning' })
      } catch {
        rssLinkError.value = '尚未取消订阅，可重新确认'
        return
      }
      if (!active) return
      await unsubscribe(cancel)
      if (!active) return
      ElMessage.success('已取消订阅')
    } else {
      rssLinkError.value = '邮件链接参数无效'
      return
    }
    if (route.query.rssConfirm !== confirm || route.query.rssUnsubscribe !== cancel) return
    const query = { ...route.query }
    delete query.rssConfirm
    delete query.rssUnsubscribe
    await router.replace({ query })
  } catch {
    rssLinkError.value = '邮件链接处理失败，请在发起订阅的浏览器中重试'
  } finally {
    rssLinkBusy = false
    if (active && (route.query.rssConfirm !== confirm || route.query.rssUnsubscribe !== cancel)) handleRssLink()
  }
}
const blogStore = useBlogStore()
const visitorStore = useVisitorStore()
const themeStore = useThemeStore()

/* 文章详情页会通过 provide/inject 传递封面和标题 */
const articleCover = ref('')
const articleTitle = ref('')
const articleMeta = ref('')

provide('setHero', { articleCover, articleTitle, articleMeta })

/* 路由切换时重置 hero 数据，子页面的 onMounted 会重新设置 */
watch(
  () => route.path,
  () => {
    articleCover.value = ''
    articleTitle.value = ''
    articleMeta.value = ''
  }
)

watch(() => [route.query.rssConfirm, route.query.rssUnsubscribe], handleRssLink)

/* 回到顶部 */
const showBackTop = ref(false)
const onScroll = () => {
  showBackTop.value = window.scrollY > 400
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  themeStore.applyTheme()
  blogStore.init()
  visitorStore.record().catch(() => {})
  handleRssLink()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  active = false
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="blog-layout">
    <BlogHeader />
    <HeroBanner
      :cover-image="articleCover"
      :title="articleTitle"
      :meta="articleMeta"
    />
    <div v-if="blogStore.loadError" role="alert">
      {{ blogStore.loadError }} <button type="button" @click="blogStore.init">重试</button>
    </div>
    <div v-if="rssLinkError" role="alert">
      {{ rssLinkError }} <button type="button" @click="handleRssLink">重试</button>
    </div>
    <div v-if="visitorStore.error" role="alert">
      {{ visitorStore.error }}
      <button type="button" @click="visitorStore.record().catch(() => {})">重试</button>
    </div>
    <main class="blog-main">
      <div class="main-inner">
        <router-view v-slot="{ Component, route: viewRoute }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="viewRoute.path" />
          </transition>
        </router-view>
      </div>
    </main>
    <BlogFooter />

    <!-- 回到顶部 -->
    <transition name="backtop-fade">
      <button
        v-show="showBackTop"
        class="back-to-top"
        title="回到顶部"
        @click="scrollToTop"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<style scoped>
.blog-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.blog-main {
  flex: 1;
  width: 100%;
  background: var(--blog-bg);
}
.main-inner {
  max-width: 1500px;
  margin: 0 auto;
  padding: 32px clamp(16px, 2.4vw, 32px);
}

/* 页面切换过渡动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 回到顶部 */
.back-to-top {
  position: fixed;
  right: 28px;
  bottom: 36px;
  z-index: 99;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--blog-border);
  background: var(--blog-card);
  color: var(--blog-text2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}
.back-to-top:hover {
  color: var(--blog-text);
  border-color: var(--blog-text3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.backtop-fade-enter-active,
.backtop-fade-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.backtop-fade-enter-from,
.backtop-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .main-inner {
    padding: 20px 16px;
  }
  .back-to-top {
    right: 16px;
    bottom: 20px;
    width: 38px;
    height: 38px;
  }
}
</style>
