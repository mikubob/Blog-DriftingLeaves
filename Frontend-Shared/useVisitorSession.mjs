import { ref, onMounted, onBeforeUnmount } from 'vue'
import { collectFingerprint } from './browserInfo.mjs'
import { setVisitorToken } from './visitorSession.mjs'

/**
 * Home/CV 的访客记录生命周期：挂载和凭据失效时记录，共享在途请求。
 * API 只负责 HTTP；此处采集浏览器信息并保存签名凭据，卸载取消请求和事件监听。
 * @param {(data: object, config: object) => Promise<import('axios').AxiosResponse>} recordVisitor
 * @returns {{record: Function, error: import('vue').Ref<string>}} 手动重试和页内错误；失败由请求层提示并在 error 中保留
 */
export function useVisitorSession(recordVisitor) {
  const error = ref('')
  let active = true
  let pending = null
  let controller = null
  const record = () => {
    if (!active) return Promise.resolve()
    if (pending) return pending
    error.value = ''
    controller = new AbortController()
    pending = recordVisitor(collectFingerprint(), { signal: controller.signal })
      .then((res) => {
        if (active) setVisitorToken(res.data.data.visitorToken)
      })
      .catch((cause) => {
        if (active && cause.code !== 'ERR_CANCELED') error.value = '访客记录失败，请重试'
      })
      .finally(() => { pending = null })
    return pending
  }
  onMounted(() => {
    window.addEventListener('visitor-session-expired', record)
    record()
  })
  onBeforeUnmount(() => {
    active = false
    controller?.abort()
    window.removeEventListener('visitor-session-expired', record)
  })
  return { record, error }
}
