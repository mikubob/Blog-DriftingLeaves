<script setup>
import { computed } from 'vue'
import { formatPercent } from './utils'

const props = defineProps({
  detail: {
    type: Object,
    default: () => ({ inode: {} })
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

const stats = computed(() => [
  {
    label: props.mode === 'container' ? '挂载路径' : '挂载点',
    value: props.detail.mount || '-'
  },
  { label: '文件系统', value: props.detail.fileSystem || '-' },
  {
    label: props.mode === 'container' ? '文件系统类型' : '磁盘类型',
    value: props.detail.type || '-'
  },
  { label: '总容量', value: props.detail.totalText || '-' },
  { label: '已使用', value: props.detail.usedText || '-' },
  { label: '可用容量', value: props.detail.availableText || '-' }
])

const showInodeCard = computed(() => props.mode !== 'container')
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">磁盘容量</h2>
        <p class="panel-desc">
          {{
            mode === 'container'
              ? '当前展示容器文件系统视角，可能只看到 overlay 或少量挂载资源'
              : '支持切换挂载点查看容量、文件系统与 inode 使用情况'
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

    <div class="metric-progress">
      <div class="metric-progress__head">
        <span>{{ mode === 'container' ? '文件系统使用率' : '磁盘使用率' }}</span>
        <strong>{{ formatPercent(detail.usagePercent) }}%</strong>
      </div>
      <el-progress
        :percentage="Number(detail.usagePercent || 0)"
        :status="Number(detail.usagePercent) >= 85 ? 'exception' : undefined"
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

    <div v-if="showInodeCard" class="inode-card">
      <div class="inode-card__title">inode 使用情况</div>
      <div class="metric-progress__head">
        <span>
          {{ detail.inode?.used ?? '-' }} / {{ detail.inode?.total ?? '-' }}
        </span>
        <strong>{{ formatPercent(detail.inode?.usagePercent) }}%</strong>
      </div>
      <el-progress
        :percentage="Number(detail.inode?.usagePercent || 0)"
        :stroke-width="8"
        :show-text="false"
      />
      <div class="inode-meta">
        <span>可用 inode：{{ detail.inode?.available ?? '-' }}</span>
        <span>磁盘大小：{{ detail.diskSizeText || '-' }}</span>
      </div>
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

.resource-select {
  width: 180px;
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

.inode-card {
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #fafbfc;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inode-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.inode-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #909399;
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

  .resource-select {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
