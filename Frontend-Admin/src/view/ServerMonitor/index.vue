<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getServerMonitorSnapshot } from '@/api/serverMonitor'
import OverviewCards from './OverviewCards.vue'
import LoadPanel from './LoadPanel.vue'
import CpuPanel from './CpuPanel.vue'
import MemoryPanel from './MemoryPanel.vue'
import DiskPanel from './DiskPanel.vue'
import NetworkPanel from './NetworkPanel.vue'
import DiskIoPanel from './DiskIoPanel.vue'
import {
  createEmptySnapshot,
  DEFAULT_LIMIT,
  DEFAULT_RESOURCE,
  normalizeSnapshot,
  REFRESH_INTERVAL,
  syncSelectedResource
} from './utils'

const pageLoading = ref(false)
const refreshing = ref(false)
const diskResourceName = ref(DEFAULT_RESOURCE)
const networkResourceName = ref(DEFAULT_RESOURCE)
const diskIoResourceName = ref(DEFAULT_RESOURCE)
const snapshot = ref(createEmptySnapshot())
let refreshTimer = null
let requestToken = 0

const topProcessColumns = [
  { key: 'pid', label: 'PID', width: 90 },
  { key: 'processName', label: '进程', minWidth: 150 },
  { key: 'cpuPercent', label: 'CPU', width: 110, suffix: '%' },
  { key: 'memoryPercent', label: '内存', width: 110, suffix: '%' }
]

const overview = computed(() => snapshot.value.overview)
const loadDetail = computed(() => snapshot.value.load)
const cpuDetail = computed(() => snapshot.value.cpu)
const memoryDetail = computed(() => snapshot.value.memory)
const diskDetail = computed(() => snapshot.value.disk)
const networkDetail = computed(() => snapshot.value.network)
const diskIoDetail = computed(() => snapshot.value.diskIo)
const diskOptions = computed(() => snapshot.value.diskOptions)
const networkOptions = computed(() => snapshot.value.networkOptions)
const diskIoOptions = computed(() => snapshot.value.diskIoOptions)
const collectTime = computed(() => snapshot.value.collectTime)
const deploymentMode = computed(() => snapshot.value.deploymentMode)
const deploymentModeText = computed(() => snapshot.value.deploymentModeText)
const deploymentTips = computed(() => snapshot.value.deploymentTips || [])

async function fetchSnapshot({ mode = 'silent' } = {}) {
  const currentToken = ++requestToken

  if (mode === 'initial') {
    pageLoading.value = true
  }
  if (mode === 'manual') {
    refreshing.value = true
  }

  try {
    const res = await getServerMonitorSnapshot({
      diskResourceName: diskResourceName.value,
      networkResourceName: networkResourceName.value,
      diskIoResourceName: diskIoResourceName.value,
      limit: DEFAULT_LIMIT
    })

    if (currentToken !== requestToken) return

    const nextSnapshot = normalizeSnapshot(res.data)
    snapshot.value = nextSnapshot
    syncSelectedResource(diskResourceName, nextSnapshot.diskOptions)
    syncSelectedResource(networkResourceName, nextSnapshot.networkOptions)
    syncSelectedResource(diskIoResourceName, nextSnapshot.diskIoOptions)
  } finally {
    if (currentToken === requestToken) {
      pageLoading.value = false
      refreshing.value = false
    }
  }
}

function startPolling() {
  stopPolling()
  refreshTimer = window.setInterval(() => {
    fetchSnapshot()
  }, REFRESH_INTERVAL)
}

function stopPolling() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
}

async function handleManualRefresh() {
  await fetchSnapshot({ mode: 'manual' })
}

watch([diskResourceName, networkResourceName, diskIoResourceName], () => {
  fetchSnapshot()
})

onMounted(async () => {
  await fetchSnapshot({ mode: 'initial' })
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <div v-loading="pageLoading" class="server-monitor-page">
    <div class="page-toolbar">
      <div>
        <h1 class="page-title">服务器监测</h1>
        <p class="page-subtitle">
          {{ deploymentMode === 'container'
            ? '当前为 Docker 容器视角，优先展示容器可见的资源状态'
            : '当前为服务器宿主机视角，展示整机负载、磁盘、网络与 IO 状态' }}
        </p>
      </div>
      <div class="toolbar-actions">
        <el-tag
          :type="deploymentMode === 'container' ? 'warning' : 'success'"
          effect="plain"
        >
          {{ deploymentModeText }}
        </el-tag>
        <span class="collect-time">
          最近采集：{{ collectTime || '加载中...' }}
        </span>
        <el-button :loading="refreshing" @click="handleManualRefresh">
          刷新
        </el-button>
      </div>
    </div>

    <div class="deployment-banner">
      <div class="deployment-banner__title">运行环境说明</div>
      <div
        v-for="(tip, index) in deploymentTips"
        :key="index"
        class="deployment-banner__item"
      >
        {{ tip }}
      </div>
    </div>

    <OverviewCards :overview="overview" :mode="deploymentMode" />

    <div class="content-grid">
      <LoadPanel
        :detail="loadDetail"
        :top-process-columns="topProcessColumns"
        :mode="deploymentMode"
      />
      <CpuPanel
        :detail="cpuDetail"
        :top-process-columns="topProcessColumns"
        :mode="deploymentMode"
      />
      <MemoryPanel
        :detail="memoryDetail"
        :top-process-columns="topProcessColumns"
        :mode="deploymentMode"
      />
      <DiskPanel
        :detail="diskDetail"
        :options="diskOptions"
        :resource-name="diskResourceName"
        :mode="deploymentMode"
        @update:resource-name="diskResourceName = $event"
      />
      <NetworkPanel
        :detail="networkDetail"
        :options="networkOptions"
        :resource-name="networkResourceName"
        :mode="deploymentMode"
        @update:resource-name="networkResourceName = $event"
      />
      <DiskIoPanel
        :detail="diskIoDetail"
        :options="diskIoOptions"
        :resource-name="diskIoResourceName"
        :mode="deploymentMode"
        @update:resource-name="diskIoResourceName = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.server-monitor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  color: #303133;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.collect-time {
  font-size: 13px;
  color: #606266;
}

.deployment-banner {
  background: #fffdf6;
  border: 1px solid #f3e1a6;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.deployment-banner__title {
  font-size: 14px;
  font-weight: 600;
  color: #7a5d00;
}

.deployment-banner__item {
  font-size: 13px;
  line-height: 1.6;
  color: #8a6d1d;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .server-monitor-page {
    gap: 12px;
  }

  .page-toolbar {
    align-items: stretch;
    padding: 14px;
  }

  .page-title {
    font-size: 18px;
  }

  .toolbar-actions {
    width: 100%;
    gap: 8px;
  }

  .toolbar-actions .el-button {
    margin-left: 0;
  }

  .collect-time {
    width: 100%;
  }
}
</style>
