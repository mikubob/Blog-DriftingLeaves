import { defineStore } from 'pinia'
import { ref, onScopeDispose } from 'vue'
import { recordVisitor } from '@/api/visitor'
import { collectFingerprint } from '@/utils/fingerprint'
import { setVisitorToken } from '@shared/visitorSession.mjs'

/**
 * 全站签名访客会话与昵称缓存；record() 共享在途 Promise，失败拒绝且可重试。
 * ready 在凭据写入后才为 true；失效先清空归属，页面监听 ready 后重载本人状态。
 * 仅昵称/联系方式持久化，visitorId 不承担授权；事件监听随 Store 生命周期清理。
 */
export const useVisitorStore = defineStore('visitor', () => {
  const visitorId = ref(null)
  const ready = ref(false)
  const error = ref('')
  const nickname = ref('')
  const email = ref('')
  let pending = null
  const record = () => {
    if (pending) return pending
    if (ready.value) return Promise.resolve()
    error.value = ''
    pending = recordVisitor(collectFingerprint()).then((res) => {
      const data = res.data.data
      setVisitorToken(data.visitorToken)
      visitorId.value = data.visitorId
      ready.value = true
    }).catch((cause) => {
      error.value = '访客会话初始化失败，请重试'
      throw cause
    }).finally(() => { pending = null })
    return pending
  }
  const expire = () => {
    ready.value = false
    visitorId.value = null
    record().catch(() => {})
  }
  window.addEventListener('visitor-session-expired', expire)
  onScopeDispose(() => window.removeEventListener('visitor-session-expired', expire))
  return { visitorId, ready, error, nickname, email, record }
}, { persist: { pick: ['nickname', 'email'] } })
