import { ref, computed, nextTick, onUnmounted } from 'vue'
import { generateCaptcha } from '@/api/captcha'
import { discussionDefaults, discussionErrors } from '@/utils/discussion'
import {
  isValidNickname,
  isValidContent,
  isValidEmailOrQq,
  isValidCaptcha
} from '@/utils/formValidate'

/**
 * 评论/留言的局部输入与挑战流程；提交及树刷新仍归页面负责。
 * loadCaptcha 等待共享访客初始化，去重在途读取，卸载后不再读取或写回。
 * 校验返回布尔值并更新 errors；挑战失败展示字段错误且保留正文。
 * @param {object} visitorStore 提供 record()、nickname、email 的访客 Store
 * @param {import('vue').Ref<HTMLTextAreaElement|null>} textarea 用于插入表情及恢复光标
 * @returns {object} 响应式表单、错误、挑战及校验/插入操作
 */
export function useDiscussionForm(visitorStore, textarea) {
  const form = ref(
    discussionDefaults(visitorStore.nickname, visitorStore.email)
  )
  const errors = ref(discussionErrors())
  const contentLength = computed(() => form.value.content?.length ?? 0)
  const captcha = ref({ question: '', captchaId: '' })
  const captchaHover = ref(false)
  const captchaFocus = ref(false)
  let captchaToken = 0
  let pendingCaptcha = null
  let active = true
  onUnmounted(() => {
    active = false
    ++captchaToken
  })
  const loadCaptcha = () => {
    if (!active) return Promise.resolve()
    if (pendingCaptcha) return pendingCaptcha
    const token = ++captchaToken
    captcha.value = { question: '', captchaId: '' }
    form.value.captchaAnswer = ''
    pendingCaptcha = (async () => {
      try {
        await visitorStore.record()
        if (token !== captchaToken) return
        const res = await generateCaptcha()
        if (token !== captchaToken) return
        captcha.value = res.data.data
        errors.value.captcha = ''
      } catch {
        if (token === captchaToken)
          errors.value.captcha = '验证码加载失败，请刷新重试'
      }
    })().finally(() => {
      pendingCaptcha = null
    })
    return pendingCaptcha
  }
  const validateField = (field) => {
    const checks = {
      nickname: () => isValidNickname(form.value.nickname),
      content: () => isValidContent(form.value.content),
      emailOrQq: () => isValidEmailOrQq(form.value.emailOrQq),
      captcha: () =>
        captcha.value.captchaId
          ? isValidCaptcha(form.value.captchaAnswer)
          : { valid: false, msg: '请先加载验证码' }
    }
    const result = checks[field]()
    errors.value[field] = result.valid ? '' : result.msg
    return result.valid
  }
  const validateForm = (withCaptcha = true) => {
    const fields = withCaptcha
      ? ['content', 'nickname', 'emailOrQq', 'captcha']
      : ['content']
    return fields.map(validateField).every(Boolean)
  }
  const insertEmoji = (char) => {
    const ta = textarea.value
    const start = ta?.selectionStart ?? form.value.content.length
    const end = ta?.selectionEnd ?? start
    const value = form.value.content
    form.value.content = value.slice(0, start) + char + value.slice(end)
    nextTick(() => {
      ta?.setSelectionRange(start + char.length, start + char.length)
      ta?.focus()
    })
  }
  return {
    form,
    errors,
    contentLength,
    captcha,
    captchaHover,
    captchaFocus,
    loadCaptcha,
    validateField,
    validateForm,
    insertEmoji
  }
}
