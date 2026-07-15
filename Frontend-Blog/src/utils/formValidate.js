/**
 * 留言/评论表单通用校验工具
 */

// 昵称最大长度，与后端 @Size(max = 15) 保持一致
const NICKNAME_MAX_LENGTH = 15
// 内容最大长度，与后端 @Size(max = 2000) 保持一致
const CONTENT_MAX_LENGTH = 2000
// 邮箱或 QQ 最大长度，与后端 @Size(max = 50) 保持一致
const EMAIL_OR_QQ_MAX_LENGTH = 50

/**
 * 校验邮箱或 QQ 格式
 * @param {string} value 用户输入值
 * @returns {{ valid: boolean, msg: string }} 校验结果
 */
export const isValidEmailOrQq = (value) => {
  // 未填写时视为有效（该字段为可选）
  if (!value || !value.trim()) {
    return { valid: true, msg: '' }
  }

  const trimmed = value.trim()

  // 长度校验
  if (trimmed.length > EMAIL_OR_QQ_MAX_LENGTH) {
    return { valid: false, msg: `邮箱/QQ号不能超过 ${EMAIL_OR_QQ_MAX_LENGTH} 字` }
  }

  // QQ 号：5-11 位纯数字
  const qqReg = /^\d{5,11}$/
  // 邮箱：基础邮箱格式
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (qqReg.test(trimmed) || emailReg.test(trimmed)) {
    return { valid: true, msg: '' }
  }

  return { valid: false, msg: '邮箱/QQ 格式不正确' }
}

/**
 * 校验昵称
 * @param {string} value 用户输入值
 * @returns {{ valid: boolean, msg: string }} 校验结果
 */
export const isValidNickname = (value) => {
  if (!value || !value.trim()) {
    return { valid: false, msg: '请输入昵称' }
  }
  if (value.trim().length > NICKNAME_MAX_LENGTH) {
    return { valid: false, msg: `昵称不能超过 ${NICKNAME_MAX_LENGTH} 字` }
  }
  return { valid: true, msg: '' }
}

/**
 * 校验留言/评论内容
 * @param {string} value 用户输入值
 * @returns {{ valid: boolean, msg: string }} 校验结果
 */
export const isValidContent = (value) => {
  if (!value || !value.trim()) {
    return { valid: false, msg: '请输入内容' }
  }
  if (value.trim().length > CONTENT_MAX_LENGTH) {
    return { valid: false, msg: `内容不能超过 ${CONTENT_MAX_LENGTH} 字` }
  }
  return { valid: true, msg: '' }
}

/**
 * 校验验证码答案
 * @param {string} answer 用户输入的答案
 * @param {number|null} result 后端返回的正确结果
 * @returns {{ valid: boolean, msg: string }} 校验结果
 */
export const isValidCaptcha = (answer, result) => {
  if (!answer || !answer.trim()) {
    return { valid: false, msg: '请输入验证码' }
  }
  const num = parseInt(answer.trim(), 10)
  if (isNaN(num) || num !== result) {
    return { valid: false, msg: '验证码错误，请重新计算' }
  }
  return { valid: true, msg: '' }
}
