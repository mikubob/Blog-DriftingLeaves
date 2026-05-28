<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores'

const route = useRoute()
const userStore = useUserStore()

/** 侧边栏是否收起 */
const collapsed = ref(false)
const isMobile = ref(false)
const mobileSidebarOpen = ref(false)

const activeMenu = computed(() => route.path)

const isNavActive = (item) => {
  if (item.path === '/article/list') return route.path.startsWith('/article')
  return activeMenu.value.startsWith(item.path)
}

/** 文章编辑页需要全高无内边距布局 */
const isEditorPage = computed(() => route.path.startsWith('/article/edit'))

const navItems = [
  { path: '/dashboard', icon: 'icon-yibiaopan', label: '仪表盘' },
  { path: '/server-monitor', icon: 'icon-shield', label: '服务器监测' },
  {
    path: '/article/list',
    icon: 'icon-bianjiwenzhang_huaban',
    label: '文章管理'
  },
  { path: '/category', icon: 'icon-folder', label: '分类 / 标签' },
  { path: '/comment', icon: 'icon-comment', label: '评论管理' },
  { path: '/message', icon: 'icon-liuyan', label: '留言管理' },
  { path: '/friend-link', icon: 'icon-link', label: '友链管理' },
  { path: '/music', icon: 'icon-music', label: '音乐管理' },
  { path: '/rss', icon: 'icon-rss', label: 'RSS 订阅' },
  { path: '/visitor', icon: 'icon-user', label: '访客管理' },
  { path: '/view-record', icon: 'icon-eye', label: '浏览记录' },
  { path: '/operation-log', icon: 'icon-wj-rz', label: '操作日志' },
  { path: '/profile', icon: 'icon-iconfontprofile', label: '个人资料' },
  { path: '/settings', icon: 'icon-setting', label: '系统设置' }
]

const handleLogout = () => {
  ElMessageBox.confirm('确认退出登录？', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logoutAction()
  })
}

const syncViewport = () => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
  if (!isMobile.value) {
    mobileSidebarOpen.value = false
  }
}

const toggleMobileSidebar = () => {
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

const closeMobileSidebar = () => {
  mobileSidebarOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    closeMobileSidebar()
  }
)

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<template>
  <div class="admin-shell">
    <div
      v-show="mobileSidebarOpen"
      class="sidebar-scrim"
      @click="closeMobileSidebar"
    />

    <!-- 左侧菜单 -->
    <aside :class="['sidebar', { collapsed, 'mobile-open': mobileSidebarOpen }]">
      <div class="sidebar-logo">
        <span v-if="!collapsed || isMobile" class="logo-text">管理控制台</span>
        <span v-else class="logo-icon">
          <span class="iconfont icon-guanliduan" />
        </span>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isNavActive(item) }]"
          @click="closeMobileSidebar"
        >
          <span :class="['iconfont', item.icon]" />
          <span v-if="!collapsed || isMobile" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <button
        class="collapse-btn"
        type="button"
        aria-label="折叠侧边栏"
        @click="collapsed = !collapsed"
      >
        <span
          :class="[
            'iconfont',
            collapsed ? 'icon-arrow-right-bold' : 'icon-arrow-left-bold'
          ]"
        />
      </button>
    </aside>

    <!-- 右侧主区域 -->
    <div class="main-wrapper">
      <!-- 顶部栏 -->
      <header class="topbar">
        <button
          class="mobile-menu-btn"
          type="button"
          aria-label="打开导航菜单"
          @click="toggleMobileSidebar"
        >
          <span class="iconfont icon-guanliduan" />
        </button>
        <div class="topbar-breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }"
              >首页</el-breadcrumb-item
            >
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-title">{{ $route.meta.title }}</div>
        <div class="topbar-right">
          <span class="user-name">
            <span class="iconfont icon-user" />
            {{ userStore.userInfo?.nickname || '管理员' }}
          </span>
          <button class="logout-btn" @click="handleLogout">
            <span class="iconfont icon-logout" />
            <span class="logout-text">退出</span>
          </button>
        </div>
      </header>

      <!-- 页面内容 -->
      <main :class="['page-main', { 'editor-page': isEditorPage }]">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  height: 100vh;
  height: 100dvh;
  background-color: #f5f7fa;
  overflow: hidden;
}

.sidebar-scrim {
  display: none;
}

/* ---- 侧边栏 ---- */
.sidebar {
  width: 220px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
}

.logo-icon .iconfont {
  font-size: 22px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #303133;
}

.nav-item.active {
  background-color: #f5f7fa;
  color: #000000;
  font-weight: 600;
}

.nav-item .iconfont {
  font-size: 18px;
  flex-shrink: 0;
}

.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-top: 1px solid #e4e7ed;
  background: transparent;
  cursor: pointer;
  color: #909399;
  transition: color 0.15s;
}

.collapse-btn:hover {
  color: #303133;
}

/* ---- 顶部栏 ---- */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 16px;
}

.mobile-menu-btn,
.topbar-title {
  display: none;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.user-name .iconfont {
  font-size: 16px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
}

.logout-btn:hover {
  border-color: #000000;
  color: #000000;
}

/* ---- 主内容 ---- */
.page-main {
  flex: 1;
  overflow-y: auto;
  padding: clamp(16px, 2vw, 24px);
}

.page-main.editor-page {
  padding: 0;
  overflow: hidden;
}

/* ---- 路由切换过渡 ---- */
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 1180px) {
  .sidebar {
    width: 208px;
  }

  .topbar {
    padding: 0 20px;
  }
}

@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .sidebar.collapsed {
    width: 56px;
  }

  .nav-item {
    padding: 11px 18px;
  }

  .topbar {
    padding: 0 18px;
  }
}

@media (max-width: 768px) {
  .sidebar-scrim {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: block;
    background: rgba(0, 0, 0, 0.28);
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 1000;
    width: min(82vw, 300px) !important;
    transform: translateX(-100%);
    box-shadow: 12px 0 32px rgba(15, 23, 42, 0.16);
    transition: transform 0.24s ease;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-logo {
    justify-content: flex-start;
    padding: 0 18px;
  }

  .nav-item {
    padding: 12px 18px;
  }

  .collapse-btn {
    display: none;
  }

  .topbar {
    height: 56px;
    padding: 0 14px;
  }

  .mobile-menu-btn {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background: #fff;
    color: #303133;
  }

  .mobile-menu-btn .iconfont {
    font-size: 18px;
  }

  .topbar-breadcrumb {
    display: none;
  }

  .topbar-title {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: #303133;
    font-size: 15px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .topbar-right {
    gap: 8px;
  }

  .user-name {
    max-width: 108px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-btn {
    width: 36px;
    height: 36px;
    justify-content: center;
    padding: 0;
  }

  .logout-text {
    display: none;
  }

  .page-main {
    padding: 14px;
  }

  .page-main.editor-page {
    padding: 0;
  }
}

@media (max-width: 520px) {
  .topbar {
    padding: 0 10px;
  }

  .user-name {
    max-width: 86px;
  }

  .page-main {
    padding: 10px;
  }

  .page-main.editor-page {
    padding: 0;
  }
}
</style>
