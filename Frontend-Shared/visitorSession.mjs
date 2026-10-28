const key = 'drifting-leaves-visitor-token'
/** 读取同源三站复用的服务端签名凭据；数字 ID 和浏览器信息不参与授权。 */
export const getVisitorToken = () => localStorage.getItem(key) || ''
/** 保存新签发凭据；空字符串用于失效清理，不自动认领旧身份。 */
export const setVisitorToken = (token) => {
  if (token) localStorage.setItem(key, token)
  else localStorage.removeItem(key)
}
