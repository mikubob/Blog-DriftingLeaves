<script setup>
import { makeLineOption } from './lineOption'
import { ref } from 'vue'
import { useChart } from './useChart'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
])

/** 输入网络快照/资源选项和部署模式；仅 emit update:resourceName，图表实例交给 useChart 随挂载管理。 */
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


function renderChart(chart) {

  const points = Array.isArray(props.detail.points) ? props.detail.points : []
  chart.setOption(
    makeLineOption({
      legend: [
        { name: '下行', color: '#303133' },
        { name: '上行', color: '#909399' }
      ],
      xAxisData: points.map((point) => point.time || '--'),
      series: [
        {
          name: '下行',
          color: '#303133',
          data: points.map((point) => Number(point.inValue ?? 0))
        },
        {
          name: '上行',
          color: '#909399',
          data: points.map((point) => Number(point.outValue ?? 0))
        }
      ]
    })
  )
}

useChart(chartEl, () => props.detail, renderChart)
</script>

<template>
  <section class="panel panel-wide">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">网络流量</h2>
        <p class="panel-desc">
          {{
            mode === 'container'
              ? '按容器可见网络接口查看上下行速度与趋势'
              : '按网卡查看上下行速度与最近趋势'
          }}
        </p>
      </div>
      <el-select
        :model-value="resourceName"
        class="resource-select"
        :placeholder="mode === 'container' ? '选择网络接口' : '选择网卡'"
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
        <span class="stat-item__label">当前上行</span>
        <span class="stat-item__value">{{ detail.upText || '-' }}</span>
      </div>
      <div class="stat-item strong">
        <span class="stat-item__label">当前下行</span>
        <span class="stat-item__value">{{ detail.downText || '-' }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">累计发送</span>
        <span class="stat-item__value">{{ detail.totalSentText || '-' }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__label">累计接收</span>
        <span class="stat-item__value">{{ detail.totalRecvText || '-' }}</span>
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
