<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { appendUnit, safeValue } from './utils'

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
])

const props = defineProps({
  detail: {
    type: Object,
    default: () => ({ points: [] })
  },
  mode: {
    type: String,
    default: 'server'
  },
  options: {
    type: Array,
    default: () => []
  },
  resourceName: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['update:resourceName'])
const chartEl = ref(null)
let chart = null

function makeLineOption({ legend, xAxisData, series, yAxisName = 'KB/s' }) {
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      data: legend.map((item) => item.name),
      textStyle: { color: '#606266', fontSize: 12 }
    },
    grid: { left: 42, right: 22, top: 36, bottom: 24 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: '#909399', fontSize: 12, padding: [0, 0, 0, 8] },
      splitLine: { lineStyle: { color: '#f1f3f5' } },
      axisLabel: { color: '#909399', fontSize: 12 }
    },
    series: series.map((item) => ({
      ...item,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2, color: item.color },
      itemStyle: { color: item.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${item.color}2f` },
            { offset: 1, color: `${item.color}00` }
          ]
        }
      }
    })),
    color: legend.map((item) => item.color)
  }
}

function renderChart() {
  if (!chart) return

  const points = Array.isArray(props.detail.points) ? props.detail.points : []
  chart.setOption(
    makeLineOption({
      legend: [
        { name: '读取', color: '#303133' },
        { name: '写入', color: '#67c23a' }
      ],
      xAxisData: points.map((point) => point.time || '--'),
      series: [
        {
          name: '读取',
          color: '#303133',
          data: points.map((point) => Number(point.readValue ?? 0))
        },
        {
          name: '写入',
          color: '#67c23a',
          data: points.map((point) => Number(point.writeValue ?? 0))
        }
      ]
    })
  )
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
  <section class="panel panel-wide">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">磁盘 IO</h2>
        <p class="panel-desc">
          {{
            mode === 'container'
              ? '展示容器文件系统可见的读取、写入速度与趋势'
              : '展示读取、写入速度与最近一段时间的 IO 趋势'
          }}
        </p>
      </div>
      <el-select
        :model-value="resourceName"
        class="resource-select"
        :placeholder="mode === 'container' ? '选择文件系统' : '选择磁盘'"
        @update:model-value="emit('update:resourceName', $event)"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div class="stats-grid compact">
      <div class="stat-item strong">
        <span class="stat-item__label">读取速度</span>
        <span class="stat-item__value">{{ detail.readText || '-' }}</span>
      </div>
      <div class="stat-item strong">
        <span class="stat-item__label">写入速度</span>
        <span class="stat-item__value">{{ detail.writeText || '-' }}</span>
      </div>
      <div class="stat-item strong">
        <span class="stat-item__label">IOPS</span>
        <span class="stat-item__value">{{ safeValue(detail.opsPerSec) }}</span>
      </div>
      <div class="stat-item strong">
        <span class="stat-item__label">平均等待</span>
        <span class="stat-item__value">{{ appendUnit(detail.awaitMs, ' ms') }}</span>
      </div>
    </div>

    <div ref="chartEl" class="chart-box" />
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

.panel-wide {
  grid-column: span 2;
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

.resource-select {
  width: 180px;
}

.stats-grid.compact {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.stat-item.strong .stat-item__value {
  font-size: 18px;
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

.chart-box {
  height: 280px;
}

@media (max-width: 1200px) {
  .panel-wide {
    grid-column: span 1;
  }

  .stats-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .panel-header {
    align-items: stretch;
  }

  .resource-select {
    width: 100%;
  }

  .stats-grid.compact {
    grid-template-columns: 1fr;
  }

  .chart-box {
    height: 240px;
  }
}
</style>
