import request from '@/utils/request'

/** 读取绑定签名访客的一次性挑战，AxiosResponse.data.data 仅含 captchaId/question；失败拒绝。 */
export const generateCaptcha = () =>
  request.get('/blog/common/captcha/generate')
