<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { formatPercent, safeValue } from './utils'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  detail: {
    type: Object,
    default: () => ({ coreUsages: [], topProcesses: [] })
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

const chartEl = ref(null)
let chart = null

function renderChart() {
  if (!chart) return
  const coreUsages = Array.isArray(props.detail.coreUsages)
    ? props.detail.coreUsages
    : []

  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 42, right: 16, top: 18, bottom: 28 },
    xAxis: {
      type: 'category',
      data: coreUsages.map((item) => item.coreLabel || '-'),
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399', fontSize: 12, interval: 0 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: '#f1f3f5' } },
      axisLabel: {
        color: '#909399',
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '核心使用率',
        type: 'bar',
        barMaxWidth: 24,
        data: coreUsages.map((item) => Number(item.usagePercent ?? 0)),
        itemStyle: {
          color: '#303133',
          borderRadius: [6, 6, 0, 0]
        }
      }
    ]
  })
}

function resizeChart() {
  chart?.resize()
}

watch(
  () => props.detail,
  () => nextTick(renderChart),
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  if (chartEl.value) {
    chart = echarts.init(chartEl.value)
    renderChart()
  }
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">CPU 详情</h2>
        <p class="panel-desc">
          {{
            mode === 'container'
              ? '展示容器可见 CPU 配额、单核占用与容器内热点进程'
              : '展示核心信息、单核占用与热点进程'
          }}
        </p>
      </div>
      <el-tag type="info" effect="plain">
        {{ detail.cpuModel || 'CPU 信息加载中' }}
      </el-tag>
    </div>

    <div class="metric-progress">
      <div class="metric-progress__head">
        <span>CPU 总使用率</span>
        <strong>{{ formatPercent(detail.cpuPercent) }}%</strong>
      </div>
      <el-progress
        :percentage="Number(detail.cpuPercent || 0)"
        :status="Number(detail.cpuPercent) >= 85 ? 'exception' : undefined"
        :stroke-width="10"
        :show-text="false"
      />
    </div>

    <div class="stats-grid compact">
      <div class="stat-item">
        <span class="stat-item__label">物理 CPU</span>
        <span class="stat-item__value">{{ safeValue(detail.physicalPackageCount) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">物理核心</span>
        <span class="stat-item__value">{{ safeValue(detail.physicalCoreCount) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">逻辑核心</span>
        <span class="stat-item__value">{{ safeValue(detail.logicalCoreCount) }}</span>
      </div>
    </div>

    <div ref="chartEl" class="chart-box small" />

    <div class="subsection">
      <div class="subsection-title">CPU 热点进程</div>
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

.stats-grid.compact {
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
}

.chart-box.small {
  height: 220px;
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

  .chart-box.small {
    height: 240px;
  }
}
</style>
