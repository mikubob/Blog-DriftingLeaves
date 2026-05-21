export const DEFAULT_RESOURCE = 'all'
export const DEFAULT_LIMIT = 20
export const REFRESH_INTERVAL = 3000

export function createEmptySnapshot() {
  return {
    collectTime: '',
    deploymentMode: 'server',
    deploymentModeText: '服务器部署',
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

export function syncSelectedResource(selectedRef, options) {
  const list = Array.isArray(options) ? options : []
  const exists = list.some((item) => item.value === selectedRef.value)
  if (!exists) {
    selectedRef.value = list[0]?.value || DEFAULT_RESOURCE
  }
}

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
  next.deploymentMode = detectDeploymentMode(raw, next)
  next.deploymentModeText =
    next.deploymentMode === 'container' ? 'Docker 容器视角' : '服务器宿主机视角'
  next.deploymentTips = buildDeploymentTips(next)

  return next
}

export function detectDeploymentMode(raw, normalized) {
  const explicitMode = String(
    raw?.deploymentMode || raw?.runtimeMode || raw?.environmentType || ''
  )
    .trim()
    .toLowerCase()

  if (['docker', 'container', 'podman', 'k8s', 'kubernetes'].includes(explicitMode)) {
    return 'container'
  }

  if (['host', 'server', 'physical', 'vm', 'baremetal'].includes(explicitMode)) {
    return 'server'
  }

  const disk = normalized?.disk ?? {}
  const diskType = String(disk.type || '').toLowerCase()
  const fileSystem = String(disk.fileSystem || '').toLowerCase()
  const mount = String(disk.mount || '').toLowerCase()
  const diskOptionCount = (normalized?.diskOptions || []).length
  const networkOptionCount = (normalized?.networkOptions || []).length
  const diskIoOptionCount = (normalized?.diskIoOptions || []).length
  const cpu = normalized?.cpu ?? {}
  const memory = normalized?.memory ?? {}

  const looksLikeContainerFs =
    diskType.includes('overlay') ||
    fileSystem.includes('overlay') ||
    fileSystem.includes('aufs') ||
    fileSystem.includes('container') ||
    mount === '/'

  const hasFewHostResources =
    diskOptionCount <= 2 && networkOptionCount <= 2 && diskIoOptionCount <= 2

  const hasContainerLikeMemory =
    !memory.sharedText ||
    memory.sharedText === '-' ||
    memory.sharedText === 'N/A' ||
    memory.sharedText === 'n/a'

  const hasContainerLikeCpu =
    Number(cpu.physicalPackageCount ?? 0) <= 1 &&
    Number(cpu.physicalCoreCount ?? 0) <= Number(cpu.logicalCoreCount ?? 0)

  if (
    looksLikeContainerFs &&
    hasFewHostResources &&
    hasContainerLikeMemory &&
    hasContainerLikeCpu
  ) {
    return 'container'
  }

  return 'server'
}

export function buildDeploymentTips(snapshot) {
  if (snapshot.deploymentMode !== 'container') {
    return [
      '当前展示的是宿主机视角指标，适合排查整台服务器的负载、磁盘和网络情况。'
    ]
  }

  const tips = [
    '当前后端运行在 Docker 容器内，监控数据更偏向容器可见资源，而不是整台宿主机。'
  ]

  if ((snapshot.diskOptions || []).length <= 2) {
    tips.push('磁盘资源较少通常是容器文件系统视角，例如 overlay 挂载。')
  }

  if ((snapshot.networkOptions || []).length <= 2) {
    tips.push('网络指标可能只反映容器命名空间中的网卡或聚合后的容器出口流量。')
  }

  if ((snapshot.diskIoOptions || []).length <= 2) {
    tips.push('磁盘 IO 很可能无法完整反映宿主机多块磁盘的真实情况。')
  }

  return tips
}
