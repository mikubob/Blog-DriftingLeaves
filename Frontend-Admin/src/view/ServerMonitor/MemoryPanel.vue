<script setup>
import { computed } from 'vue'
import { formatPercent } from './utils'

const props = defineProps({
  detail: {
    type: Object,
    default: () => ({ topProcesses: [] })
  },
  mode: {
    type: String,
    default: 'server'
  },
  topProcessColumns: {
    type: Array,
    default: () => []
  }
})

const stats = computed(() =>
  [
    {
      label: props.mode === 'container' ? '容器已用内存' : '已用内存',
      value: props.detail.usedText || '-'
    },
    {
      label: props.mode === 'container' ? '容器总内存' : '总内存',
      value: props.detail.totalText || '-'
    },
    { label: '可用内存', value: props.detail.availableText || '-' },
    { label: '空闲内存', value: props.detail.freeText || '-' },
    { label: '共享内存', value: props.detail.sharedText || '-' },
    { label: '缓冲/缓存', value: props.detail.bufferCacheText || '-' },
    { label: '交换分区', value: props.detail.swapText || '-' }
  ].filter((item) => item.value !== '-')
)
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">内存详情</h2>
        <p class="panel-desc">
          {{
            mode === 'container'
              ? '展示容器内存占用情况与容器内存占比较高的进程'
              : '展示内存占用情况与内存占比较高的进程'
          }}
        </p>
      </div>
      <el-tag type="warning" effect="plain">
        {{ detail.usedText || '-' }} / {{ detail.totalText || '-' }}
      </el-tag>
    </div>

    <div class="metric-progress">
      <div class="metric-progress__head">
        <span>{{ mode === 'container' ? '容器内存使用率' : '内存使用率' }}</span>
        <strong>{{ formatPercent(detail.memoryPercent) }}%</strong>
      </div>
      <el-progress
        :percentage="Number(detail.memoryPercent || 0)"
        :status="Number(detail.memoryPercent) >= 85 ? 'exception' : undefined"
        :stroke-width="10"
        :show-text="false"
      />
    </div>

    <div class="stats-grid">
      <div v-for="item in stats" :key="item.label" class="stat-item">
        <span class="stat-item__label">{{ item.label }}</span>
        <span class="stat-item__value">{{ item.value }}</span>
      </div>
    </div>

    <div class="subsection">
      <div class="subsection-title">内存热点进程</div>
      <el-table
        :data="detail.topProcesses || []"
        border
        stripe
        size="small"
        empty-text="暂无进程数据"
      >
        <el-table-column
          v-for="column in topProcessColumns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          show-overflow-tooltip
        >
          <template v-if="column.suffix" #default="{ row }">
            {{ formatPercent(row[column.key]) }}{{ column.suffix }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.panel-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}

.metric-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-progress__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.metric-progress__head strong {
  font-size: 18px;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-item {
  min-width: 0;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #fafbfc;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item__label {
  font-size: 12px;
  color: #909399;
}

.stat-item__value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  word-break: break-all;
}

.subsection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .panel-header {
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
