<script setup>
import { computed } from 'vue'
import { formatPercent, getPercentTone } from './utils'

const props = defineProps({
  overview: {
    type: Object,
    default: () => ({})
  },
  mode: {
    type: String,
    default: 'server'
  }
})

const cards = computed(() => [
  {
    key: 'load',
    label: '系统负载',
    value: `${formatPercent(props.overview.loadPercent)}%`,
    extra: props.overview.loadStatusText || '实时采集',
    status: getPercentTone(props.overview.loadPercent)
  },
  {
    key: 'cpu',
    label: 'CPU 使用率',
    value: `${formatPercent(props.overview.cpuPercent)}%`,
    extra: `${props.overview.cpuCoreCount ?? '-'} 核`,
    status: getPercentTone(props.overview.cpuPercent)
  },
  {
    key: 'memory',
    label: props.mode === 'container' ? '容器内存占用' : '内存占用',
    value: `${formatPercent(props.overview.memoryPercent)}%`,
    extra: `${props.overview.memoryUsedText || '-'} / ${props.overview.memoryTotalText || '-'}`,
    status: getPercentTone(props.overview.memoryPercent)
  },
  {
    key: 'disk',
    label: props.mode === 'container' ? '容器文件系统占用' : '磁盘占用',
    value: `${formatPercent(props.overview.diskPercent)}%`,
    extra: `${props.overview.diskUsedText || '-'} / ${props.overview.diskTotalText || '-'}`,
    status: getPercentTone(props.overview.diskPercent)
  }
])
</script>

<template>
  <div class="overview-grid">
    <div
      v-for="card in cards"
      :key="card.key"
      :class="['overview-card', `is-${card.status}`]"
    >
      <div class="overview-card__label">{{ card.label }}</div>
      <div class="overview-card__value">{{ card.value }}</div>
      <div class="overview-card__extra">{{ card.extra }}</div>
    </div>
  </div>
</template>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.overview-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 18px;
  position: relative;
  overflow: hidden;
}

.overview-card::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 3px;
  background: #303133;
  opacity: 0.12;
}

.overview-card.is-warning::after {
  background: #e6a23c;
  opacity: 0.24;
}

.overview-card.is-danger::after {
  background: #f56c6c;
  opacity: 0.3;
}

.overview-card__label {
  font-size: 13px;
  color: #909399;
}

.overview-card__value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.overview-card__extra {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
