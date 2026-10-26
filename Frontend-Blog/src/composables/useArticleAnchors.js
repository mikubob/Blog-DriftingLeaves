import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { ensureHeadingIds, findFragmentTarget } from '@/utils/markdownAnchors'

export const useArticleAnchors = (contentRef) => {
  const scrollToFragment = (hash, behavior = 'smooth') => {
    const target = findFragmentTarget(contentRef.value, hash)
    if (!target) return false
    target.scrollIntoView({ block: 'start', behavior })
    return true
  }

  const restoreFragment = () => scrollToFragment(window.location.hash, 'auto')

  const onContentRendered = async () => {
    await nextTick()
    ensureHeadingIds(contentRef.value)
    restoreFragment()
  }

  const onAnchorClick = (event) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link = event.target.closest('a[href^="#"]')
    if (!link || !contentRef.value?.contains(link)) return
    const hash = link.getAttribute('href')
    if (!findFragmentTarget(contentRef.value, hash)) return
    event.preventDefault()
    // Native hash navigation keeps browser history and copied article URLs working.
    if (window.location.hash !== hash) window.location.hash = hash
    scrollToFragment(hash)
  }

  onMounted(() => window.addEventListener('hashchange', restoreFragment))
  onBeforeUnmount(() =>
    window.removeEventListener('hashchange', restoreFragment)
  )

  return { onContentRendered, onAnchorClick }
}
