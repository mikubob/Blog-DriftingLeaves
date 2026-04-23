<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores'

const props = defineProps({
  contentHtml: { type: String, default: '' }
})

const themeStore = useThemeStore()
const headings = ref([])
const activeId = ref('')
const tocBodyRef = ref(null)
const mobileTocBodyRef = ref(null)
const isMobile = ref(false)
const mobileOpen = ref(false)
const bodyOverflow = ref('')

let mediaQuery = null
let mediaQueryListener = null

const isDark = computed(() => {
  if (themeStore.mode === 'dark') return true
  if (themeStore.mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

const getHeaderOffset = () => {
  const header = document.querySelector('.site-header')
  const headerHeight = header?.getBoundingClientRect().height ?? 58
  return Math.round(headerHeight + 16)
}

const syncMobileState = (matches) => {
  isMobile.value = matches
  if (!matches) {
    mobileOpen.value = false
  }
}

const extractHeadings = () => {
  nextTick(() => {
    const el = document.querySelector('.article-content')
    if (!el) return

    const nodes = el.querySelectorAll('h1, h2, h3, h4')
    const list = []

    nodes.forEach((node, idx) => {
      const id = node.id || `heading-${idx}`
      node.id = id
      node.style.scrollMarginTop = `${getHeaderOffset()}px`
      list.push({
        id,
        text: node.textContent.trim(),
        level: parseInt(node.tagName.charAt(1), 10)
      })
    })

    headings.value = list
    handleScroll()
  })
}

const handleScroll = () => {
  const offset = getHeaderOffset() + 8

  for (let i = headings.value.length - 1; i >= 0; i--) {
    const el = document.getElementById(headings.value[i].id)
    if (el && el.getBoundingClientRect().top <= offset) {
      activeId.value = headings.value[i].id
      return
    }
  }

  if (headings.value.length) {
    activeId.value = headings.value[0].id
  }
}

const closeMobileToc = () => {
  mobileOpen.value = false
}

const openMobileToc = () => {
  mobileOpen.value = true
}

const scrollTo = (id) => {
  const el = document.getElementById(id)
  if (el) {
    const top =
      window.scrollY + el.getBoundingClientRect().top - getHeaderOffset()
    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth'
    })
  }

  if (isMobile.value) {
    closeMobileToc()
  }
}

const scrollActiveIntoView = (containerRef) => {
  nextTick(() => {
    const container = containerRef.value
    if (!container || !activeId.value) return

    const activeItem = container.querySelector('.toc-item.active')
    activeItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

watch(() => props.contentHtml, extractHeadings)

watch(activeId, () => {
  scrollActiveIntoView(tocBodyRef)
  scrollActiveIntoView(mobileTocBodyRef)
})

watch(mobileOpen, (open) => {
  if (typeof document === 'undefined') return

  if (open) {
    bodyOverflow.value = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    scrollActiveIntoView(mobileTocBodyRef)
  } else {
    document.body.style.overflow = bodyOverflow.value
  }
})

onMounted(() => {
  extractHeadings()
  handleScroll()

  mediaQuery = window.matchMedia('(max-width: 960px)')
  syncMobileState(mediaQuery.matches)
  mediaQueryListener = (event) => syncMobileState(event.matches)
  mediaQuery.addEventListener('change', mediaQueryListener)

  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  if (mediaQuery && mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener)
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = bodyOverflow.value
  }

  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div v-if="headings.length" class="toc-wrap">
    <div class="toc-card side-card toc-desktop">
      <div class="toc-header">
        <h4 class="toc-title"><i class="iconfont icon-guidang" /> 目录</h4>
      </div>

      <div ref="tocBodyRef" class="toc-body">
        <ul class="toc-list">
          <li
            v-for="h in headings"
            :key="h.id"
            class="toc-item"
            :class="{ active: activeId === h.id, [`level-${h.level}`]: true }"
            @click="scrollTo(h.id)"
          >
            <span class="toc-item-text">{{ h.text }}</span>
          </li>
        </ul>
      </div>
    </div>

    <button
      v-if="isMobile"
      class="toc-mobile-trigger"
      :class="{ 'is-dark-trigger': isDark }"
      type="button"
      @click="openMobileToc"
    >
      <i class="iconfont icon-guidang" />
      <span>目录</span>
    </button>

    <transition name="toc-fade">
      <div
        v-if="isMobile && mobileOpen"
        class="toc-mobile-overlay"
        @click.self="closeMobileToc"
      >
        <div class="toc-mobile-panel">
          <div class="toc-mobile-head">
            <div class="toc-mobile-title">
              <i class="iconfont icon-guidang" />
              <span>目录</span>
            </div>
            <button
              class="toc-mobile-close"
              type="button"
              @click="closeMobileToc"
            >
              ×
            </button>
          </div>

          <div ref="mobileTocBodyRef" class="toc-body toc-mobile-body">
            <ul class="toc-list">
              <li
                v-for="h in headings"
                :key="`mobile-${h.id}`"
                class="toc-item"
                :class="{ active: activeId === h.id, [`level-${h.level}`]: true }"
                @click="scrollTo(h.id)"
              >
                <span class="toc-item-text">{{ h.text }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.toc-wrap {
  width: 100%;
}

.toc-card {
  --toc-accent: #2f6bff;
  background: var(--blog-card, #fff);
  border: 1px solid var(--blog-border-light, #ebeef5);
  border-radius: 10px;
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.06),
    0 1px 2px rgba(15, 23, 42, 0.04);
  width: 100%;
  max-height: min(80vh, calc(100vh - 120px));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.toc-header {
  flex-shrink: 0;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.toc-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--blog-text, #303133);
}

.toc-title .iconfont {
  font-size: 15px;
  color: var(--toc-accent);
}

.toc-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 10px 8px 12px 10px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.toc-card:hover .toc-body,
.toc-card:focus-within .toc-body,
.toc-mobile-panel:hover .toc-body,
.toc-mobile-panel:focus-within .toc-body {
  scrollbar-color: rgba(148, 163, 184, 0.72) transparent;
}

.toc-body::-webkit-scrollbar {
  width: 6px;
}

.toc-body::-webkit-scrollbar-track {
  background: transparent;
}

.toc-body::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 999px;
}

.toc-card:hover .toc-body::-webkit-scrollbar-thumb,
.toc-card:focus-within .toc-body::-webkit-scrollbar-thumb,
.toc-mobile-panel:hover .toc-body::-webkit-scrollbar-thumb,
.toc-mobile-panel:focus-within .toc-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.72);
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-item {
  position: relative;
  padding: 7px 10px 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--blog-text2, #606266);
  font-size: 13px;
  line-height: 1.55;
  transition:
    color 0.15s,
    background 0.15s;
}

.toc-item::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.15s;
}

.toc-item-text {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.toc-item:hover {
  color: var(--blog-text, #303133);
  background: rgba(47, 107, 255, 0.08);
}

.toc-item.active {
  color: var(--blog-text, #111827);
  font-weight: 700;
  background: linear-gradient(
    90deg,
    rgba(47, 107, 255, 0.14),
    rgba(47, 107, 255, 0.04)
  );
}

.toc-item.active::before {
  background: linear-gradient(180deg, #2f6bff 0%, #63a2ff 100%);
}

.toc-item.level-1 {
  padding-left: 14px;
}

.toc-item.level-2 {
  padding-left: 28px;
}

.toc-item.level-3 {
  padding-left: 42px;
  font-size: 12.5px;
}

.toc-item.level-4 {
  padding-left: 56px;
  font-size: 12.5px;
}

.toc-mobile-trigger,
.toc-mobile-close {
  border: none;
  font: inherit;
}

.toc-mobile-trigger {
  position: fixed;
  right: 16px;
  bottom: 84px;
  z-index: 40;
  display: none;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 999px;
  background: #111111;
  color: #ffffff;
  border: 1px solid rgba(17, 17, 17, 0.92);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(14px);
}

.toc-mobile-trigger .iconfont {
  font-size: 14px;
}

.toc-mobile-trigger.is-dark-trigger {
  background: #ffffff;
  color: #111111;
  border-color: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.42);
}

.toc-mobile-trigger.is-dark-trigger .iconfont {
  color: #111111;
}

.toc-mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.44);
  backdrop-filter: blur(6px);
}

.toc-mobile-panel {
  width: 100%;
  max-height: min(78vh, calc(100vh - 88px));
  background: var(--blog-card, #fff);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.toc-mobile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.toc-mobile-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--blog-text, #303133);
}

.toc-mobile-title .iconfont {
  color: var(--toc-accent);
}

.toc-mobile-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.14);
  color: var(--blog-text2, #606266);
  font-size: 20px;
  line-height: 1;
}

.toc-mobile-body {
  max-height: min(62vh, calc(100vh - 160px));
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}

.toc-fade-enter-active,
.toc-fade-leave-active {
  transition: opacity 0.22s ease;
}

.toc-fade-enter-from,
.toc-fade-leave-to {
  opacity: 0;
}

:global(html.dark) .toc-mobile-overlay {
  background: rgba(3, 8, 20, 0.68);
  backdrop-filter: blur(10px);
}

:global(html.dark) .toc-mobile-panel {
  background: linear-gradient(180deg, #20242d 0%, #171b22 100%);
  border-top: 1px solid rgba(116, 167, 255, 0.18);
  box-shadow:
    0 -18px 46px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.04) inset;
}

:global(html.dark) .toc-mobile-head {
  border-bottom-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

:global(html.dark) .toc-mobile-title {
  color: #eef3ff;
}

:global(html.dark) .toc-mobile-title .iconfont {
  color: #7fb0ff;
}

:global(html.dark) .toc-mobile-close {
  background: rgba(255, 255, 255, 0.08);
  color: #d8e1f0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

:global(html.dark) .toc-mobile-close:hover {
  background: rgba(127, 176, 255, 0.16);
  color: #f5f9ff;
}

@media (max-width: 960px) {
  :global(html.dark) .toc-item:hover {
    color: #f3f7ff;
    background: rgba(127, 176, 255, 0.12);
  }

  :global(html.dark) .toc-item.active {
    color: #f7fbff;
    background: linear-gradient(
      90deg,
      rgba(76, 132, 255, 0.28),
      rgba(76, 132, 255, 0.08)
    );
  }
}

@media (max-width: 960px) {
  .toc-desktop {
    display: none;
  }

  .toc-mobile-trigger {
    display: inline-flex;
  }
}
</style>
