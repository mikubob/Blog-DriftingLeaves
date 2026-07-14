import { createApp } from 'vue'
import { useUserStore } from '@/stores/modules/user'

import App from './App.vue'
import router from './router'
import pinia from './stores'

import '@/assets/styles/ali-iconfont.css'
import '@/assets/styles/main.scss'

const app = createApp(App)

app.use(pinia)

// 应用启动前尝试恢复登录状态
// Token 存储在后端 HttpOnly Cookie 中，前端通过调用个人信息接口判断是否已登录
const userStore = useUserStore()
try {
  await userStore.fetchUserInfo(true)
} catch {
  userStore.setLoginStatus(false)
}

app.use(router)

app.mount('#app')
