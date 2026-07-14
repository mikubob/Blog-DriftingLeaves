import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, getProfile, logout } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref({})
    const isLoggedIn = ref(false)

    /** 设置登录状态 */
    const setLoginStatus = (status) => {
      isLoggedIn.value = status
    }

    const setUserInfo = (info) => (userInfo.value = info)

    /** 清除登录状态 */
    const clearUserInfo = () => {
      userInfo.value = {}
      isLoggedIn.value = false
    }

    /**
     * 登录动作：调用 API → 拉取用户信息 → 跳转
     * Token 由后端通过 HttpOnly Cookie 下发，前端不再本地存储
     * @param {{ username: string, password: string, code: string }} payload
     */
    const loginAction = async (payload) => {
      const res = await login(payload)
      setUserInfo({ id: res.data.id })
      try {
        await fetchUserInfo()
      } catch {
        // 个人信息获取失败不影响登录跳转
      }
      router.push('/dashboard')
    }

    /**
     * 拉取当前管理员信息
     * @param {boolean} silent 是否为静默请求（用于启动时恢复登录状态）
     */
    const fetchUserInfo = async (silent = false) => {
      const res = await getProfile(silent)
      userInfo.value = res.data || {}
      isLoggedIn.value = true
    }

    /** 退出登录 */
    const logoutAction = async () => {
      try {
        if (userInfo.value?.id) {
          await logout({ id: userInfo.value.id })
        }
      } finally {
        clearUserInfo()
        ElMessage.success('已退出登录')
        router.push('/login')
      }
    }

    return {
      userInfo,
      isLoggedIn,
      setLoginStatus,
      setUserInfo,
      clearUserInfo,
      loginAction,
      fetchUserInfo,
      logoutAction
    }
  }
)
