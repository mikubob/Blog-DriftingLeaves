import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import * as echarts from 'echarts/core'
/**
 * 监控图表的挂载/深度更新/resize/dispose；nextTick 后再次确认仍挂载。
 * @param {import('vue').Ref<HTMLElement|null>} element 图表容器
 * @param {() => object} source 响应式数据来源
 * @param {(chart: object) => void} render 使用当前数据更新既有图表
 */
export function useChart(element, source, render) {
  let chart = null
  let active = true
  const update = () => {
    if (chart) render(chart)
  }
  const resize = () => chart?.resize()
  watch(source, () => nextTick(update), { deep: true })
  onMounted(async () => {
    await nextTick()
    if (!active || !element.value) return
    chart = echarts.init(element.value)
    update()
    window.addEventListener('resize', resize)
  })
  onBeforeUnmount(() => {
    active = false
    window.removeEventListener('resize', resize)
    chart?.dispose()
    chart = null
  })
}
