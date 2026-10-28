/**
 * 收集当前页面与浏览器展示信息用于访客记录；不生成身份或授权凭据。
 * @returns {object} 可序列化的浏览器信息，仅在浏览器中调用
 */
export const collectFingerprint = () => ({
  pagePath: window.location.pathname,
  pageTitle: document.title,
  referer: document.referrer || '',
  screen: `${window.screen.width}x${window.screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  language: navigator.language || '',
  platform: navigator.platform || navigator.userAgentData?.platform || '',
  cookiesEnabled: navigator.cookieEnabled,
  deviceMemory: navigator.deviceMemory || null,
  hardwareConcurrency: navigator.hardwareConcurrency || null
})
