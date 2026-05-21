<script setup>
import { formatPercent, getLoadTagType, safeValue } from './utils'

defineProps({
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
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">负载详情</h2>
        <p class="panel-desc">
          {{
            mode === 'container'
              ? '展示容器可见的负载状态、平均负载与 CPU 时间片分布'
              : '展示整体负载状态、平均负载与 CPU 时间片分布'
          }}
        </p>
      </div>
      <el-tag :type="getLoadTagType(detail.loadPercent)" effect="plain">
        {{ detail.statusText || '实时采集中' }}
      </el-tag>
    </div>

    <div class="metric-progress">
      <div class="metric-progress__head">
        <span>当前负载</span>
        <strong>{{ formatPercent(detail.loadPercent) }}%</strong>
      </div>
      <el-progress
        :percentage="Number(detail.loadPercent || 0)"
        :status="Number(detail.loadPercent) >= 85 ? 'exception' : undefined"
        :stroke-width="10"
        :show-text="false"
      />
    </div>

    <div class="stats-grid compact">
      <div class="stat-item">
        <span class="stat-item__label">1 分钟</span>
        <span class="stat-item__value">{{ safeValue(detail.loadAverage1m) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">5 分钟</span>
        <span class="stat-item__value">{{ safeValue(detail.loadAverage5m) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">15 分钟</span>
        <span class="stat-item__value">{{ safeValue(detail.loadAverage15m) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">运行进程</span>
        <span class="stat-item__value">
          {{ safeValue(detail.runningProcessCount) }} /
          {{ safeValue(detail.totalProcessCount) }}
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">用户态</span>
        <span class="stat-item__value">{{ formatPercent(detail.userPercent) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">系统态</span>
        <span class="stat-item__value">{{ formatPercent(detail.systemPercent) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">空闲</span>
        <span class="stat-item__value">{{ formatPercent(detail.idlePercent) }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">IO 等待</span>
        <span class="stat-item__value">{{ formatPercent(detail.iowaitPercent) }}%</span>
      </div>
    </div>

    <div class="subsection">
      <div class="subsection-title">负载热点进程</div>
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
  gap: 12px;
}

.stats-grid.compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  .stats-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .panel-header {
    align-items: stretch;
  }

  .stats-grid.compact {
    grid-template-columns: 1fr;
  }
}
</style>
