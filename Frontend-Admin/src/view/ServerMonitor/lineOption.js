/** 生成监控折线图配置；输入已由各面板转换为时间轴和序列，不读响应式状态或操作图表实例。 */
export function makeLineOption({
  legend,
  xAxisData,
  series,
  yAxisName = 'KB/s'
}) {
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

