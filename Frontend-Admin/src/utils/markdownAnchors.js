export * from '../../../Frontend-Shared/markdownAnchors.mjs'
import { findFragmentTarget } from '../../../Frontend-Shared/markdownAnchors.mjs'

/** 处理编辑器预览内的普通片段点击；修饰键与其他链接保留浏览器默认行为。 */
export const handlePreviewAnchorClick = (event) => {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  const link = event.target.closest('a[href^="#"]')
  if (!link || !event.currentTarget.contains(link)) return
  const target = findFragmentTarget(
    event.currentTarget,
    link.getAttribute('href')
  )
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
