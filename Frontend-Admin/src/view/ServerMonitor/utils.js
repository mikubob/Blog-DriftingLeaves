export const DEFAULT_RESOURCE = 'all'
export const DEFAULT_LIMIT = 20
export const REFRESH_INTERVAL = 3000

/** 尚无快照时的展示结构；部署模式保持 unknown，不从硬件字段猜测。 */
export function createEmptySnapshot() {
  return {
    collectTime: '',
    deploymentMode: 'unknown',
    deploymentModeText: '未知部署环境',
    deploymentTips: [],
    overview: {},
    load: { topProcesses: [] },
    cpu: { coreUsages: [], topProcesses: [] },
    memory: { topProcesses: [] },
    disk: { inode: {} },
    network: { points: [] },
    diskIo: { points: [] },
    diskOptions: [{ label: '全部', value: DEFAULT_RESOURCE }],
    networkOptions: [{ label: '全部', value: DEFAULT_RESOURCE }],
    diskIoOptions: [{ label: '全部', value: DEFAULT_RESOURCE }]
  }
}

export function safeValue(value) {
  return value ?? '-'
}

export function appendUnit(value, unit) {
  return value === 0 || value ? `${value}${unit}` : '-'
}

export function formatPercent(value) {
  if (value === 0 || value) {
    const num = Number(value)
    return Number.isInteger(num) ? num : num.toFixed(2).replace(/\.?0+$/, '')
  }
  return '-'
}

export function getPercentTone(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return 'normal'
  if (num >= 85) return 'danger'
  if (num >= 60) return 'warning'
  return 'normal'
}

export function getLoadTagType(value) {
  const tone = getPercentTone(value)
  if (tone === 'danger') return 'danger'
  if (tone === 'warning') return 'warning'
  return 'success'
}

export function normalizeOptions(options) {
  const list = Array.isArray(options) ? options.filter(Boolean) : []
  const hasAll = list.some((item) => item?.value === DEFAULT_RESOURCE)
  return hasAll
    ? list
    : [{ label: '全部', value: DEFAULT_RESOURCE }, ...list]
}

/** 将服务端快照补齐为面板输入；不修改输入、不操作响应式引用，缺失资源选项补上“全部”。 */
export function normalizeSnapshot(data) {
  const next = createEmptySnapshot()
  const raw = data ?? {}

  next.collectTime = raw.collectTime || ''
  next.overview = raw.overview ?? next.overview
  next.load = {
    topProcesses: [],
    ...(raw.load ?? {})
  }
  next.cpu = {
    coreUsages: [],
    topProcesses: [],
    ...(raw.cpu ?? {})
  }
  next.memory = {
    topProcesses: [],
    ...(raw.memory ?? {})
  }
  next.disk = {
    inode: {},
    ...(raw.disk ?? {})
  }
  next.network = {
    points: [],
    ...(raw.network ?? {})
  }
  next.diskIo = {
    points: [],
    ...(raw.diskIo ?? {})
  }
  next.diskOptions = normalizeOptions(raw.diskOptions)
  next.networkOptions = normalizeOptions(raw.networkOptions)
  next.diskIoOptions = normalizeOptions(raw.diskIoOptions)
  next.deploymentMode = ['server', 'container'].includes(raw.deploymentMode)
    ? raw.deploymentMode : 'unknown'
  next.deploymentModeText =
    raw.deploymentModeText || '未知部署环境'
  next.deploymentTips = Array.isArray(raw.deploymentTips) ? raw.deploymentTips : []

  return next
}
