// Keep this rule in sync with the blog client and MarkdownUtil on the server.
export const headingSlug = (text) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_\s-]/gu, '')
    .replace(/\s/g, '-') || 'section'

export const uniqueHeadingId = (text, used) => {
  const base = headingSlug(text)
  let id = base
  let suffix = 0
  while (used.has(id)) id = `${base}-${++suffix}`
  used.add(id)
  return id
}

// md-editor-v3 restarts heading indexes on every render, including live edits.
export class MarkdownHeadingIds {
  used = new Set()
  lastIndex = 0

  getId = ({ text, index }) => {
    if (index <= this.lastIndex) this.used.clear()
    this.lastIndex = index
    return uniqueHeadingId(text, this.used)
  }
}

export const findFragmentTarget = (container, hash) => {
  if (!container || !hash.startsWith('#') || hash === '#') return null
  let id
  try {
    id = decodeURIComponent(hash.slice(1))
  } catch {
    return null
  }
  // Comparing IDs avoids selector errors with Chinese text, dots and brackets.
  return Array.from(container.querySelectorAll('[id], a[name]')).find(
    (node) => node.id === id || node.getAttribute('name') === id
  )
}

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
