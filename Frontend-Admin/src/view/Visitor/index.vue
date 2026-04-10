<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useVisitorStore } from '@/stores'
import { useBatchSelection } from '@/composables/useBatchSelection'

const visitorStore = useVisitorStore()

const searchForm = ref({ country: '', province: '', city: '', status: '' })
const page = ref(1)
const size = ref(15)

const {
  tableRef,
  selected,
  allSelected,
  handleSelectionChange,
  clearSelection,
  toggleSelectAll
} = useBatchSelection(() => visitorStore.list)

const load = () => {
  visitorStore.fetchList({
    page: page.value,
    pageSize: size.value,
    country: searchForm.value.country || undefined,
    province: searchForm.value.province || undefined,
    city: searchForm.value.city || undefined,
    status: searchForm.value.status === '' ? undefined : searchForm.value.status
  })
}

const handleSearch = () => {
  page.value = 1
  clearSelection()
  load()
}

const handleReset = () => {
  searchForm.value = { country: '', province: '', city: '', status: '' }
  handleSearch()
}

const handlePageChange = (value) => {
  page.value = value
  clearSelection()
  load()
}

const handleSizeChange = (value) => {
  size.value = value
  page.value = 1
  clearSelection()
  load()
}

const blockOne = async (row) => {
  try {
    await ElMessageBox.confirm(`确认封禁 IP「${row.ip}」？`, '警告', {
      confirmButtonText: '封禁',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  await visitorStore.block([row.id])
  ElMessage.success('封禁成功')
  load()
}

const batchBlock = async () => {
  if (!selected.value.length) return ElMessage.warning('请先选择访客')
  try {
    await ElMessageBox.confirm(
      `确认封禁选中的 ${selected.value.length} 位访客？`,
      '警告',
      { confirmButtonText: '封禁', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  await visitorStore.block(selected.value.map((row) => row.id))
  clearSelection()
  ElMessage.success('批量封禁成功')
  load()
}

const unblockOne = async (row) => {
  await visitorStore.unblock([row.id])
  ElMessage.success('解封成功')
  load()
}

const batchUnblock = async () => {
  if (!selected.value.length) return ElMessage.warning('请先选择访客')
  await visitorStore.unblock(selected.value.map((row) => row.id))
  clearSelection()
  ElMessage.success('批量解封成功')
  load()
}

const deleteOne = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除 IP「${row.ip}」的访客记录？`, '警告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  await visitorStore.remove([row.id])
  ElMessage.success('删除成功')
  load()
}

const batchDelete = async () => {
  if (!selected.value.length) return ElMessage.warning('请先选择访客')
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selected.value.length} 位访客？`,
      '警告',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  await visitorStore.remove(selected.value.map((row) => row.id))
  clearSelection()
  ElMessage.success('批量删除成功')
  load()
}

const fmtDate = (value) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'

const visitorStatusClass = (isBlocked) =>
  isBlocked ? 'status-tag is-danger' : 'status-tag is-success'

onMounted(load)
</script>

<template>
  <div class="visitor-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchForm.country"
          placeholder="搜索国家"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.province"
          placeholder="搜索省份"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.city"
          placeholder="搜索城市"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.status"
          placeholder="全部状态"
          clearable
          class="select-sm"
        >
          <el-option label="正常" :value="0" />
          <el-option label="已封禁" :value="1" />
        </el-select>
        <el-button @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button
          plain
          :disabled="!visitorStore.list.length"
          @click="toggleSelectAll"
        >
          {{ allSelected ? '取消全选' : '全选当前页' }}
        </el-button>
        <el-button
          plain
          class="batch-action-btn batch-action-btn--success"
          :disabled="!selected.length"
          @click="batchUnblock"
        >
          批量解封
        </el-button>
        <el-button
          plain
          class="batch-action-btn batch-action-btn--danger"
          :disabled="!selected.length"
          @click="batchBlock"
        >
          <span class="iconfont icon-ban" />
          批量封禁
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="!selected.length"
          @click="batchDelete"
        >
          <span class="iconfont icon-delete" />
          批量删除
        </el-button>
      </div>
    </div>

    <div v-loading="visitorStore.loading" class="table-wrap">
      <el-table
        ref="tableRef"
        :data="visitorStore.list"
        border
        stripe
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="ip" label="IP 地址" min-width="140" />
        <el-table-column
          prop="country"
          label="国家"
          min-width="90"
          show-overflow-tooltip
        />
        <el-table-column
          prop="province"
          label="省份"
          min-width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="city"
          label="城市"
          min-width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="totalViews"
          label="浏览次数"
          min-width="90"
          align="center"
        />
        <el-table-column label="状态" min-width="80" align="center">
          <template #default="{ row }">
            <span :class="visitorStatusClass(row.isBlocked)">
              {{ row.isBlocked ? '已封禁' : '正常' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="首次访问" min-width="150" align="center">
          <template #default="{ row }">{{
            fmtDate(row.firstVisitTime)
          }}</template>
        </el-table-column>
        <el-table-column label="最近访问" min-width="150" align="center">
          <template #default="{ row }">{{
            fmtDate(row.lastVisitTime)
          }}</template>
        </el-table-column>
        <el-table-column label="封禁到期" min-width="150" align="center">
          <template #default="{ row }">
            <span>{{
              row.isBlocked ? fmtDate(row.expiresAt) || '永久' : '-'
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                v-if="!row.isBlocked"
                link
                size="small"
                @click="blockOne(row)"
              >
                封禁
              </el-button>
              <el-button v-else link size="small" @click="unblockOne(row)">
                解封
              </el-button>
              <el-divider direction="vertical" />
              <el-button
                link
                size="small"
                type="danger"
                @click="deleteOne(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :page-sizes="[10, 15, 20, 50]"
        :total="visitorStore.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.visitor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-left .iconfont,
.toolbar-right .iconfont {
  font-size: 14px;
  margin-right: 4px;
}

.toolbar-right :deep(.batch-action-btn--success) {
  color: #2f8f5b;
  border-color: #b7e1c6;
  background: #eaf7f0;
}

.toolbar-right :deep(.batch-action-btn--success:hover),
.toolbar-right :deep(.batch-action-btn--success:focus) {
  color: #256f47;
  border-color: #8dcdab;
  background: #ddf1e6;
}

.toolbar-right :deep(.batch-action-btn--danger) {
  color: #c86a00;
  border-color: #f3c27a;
  background: #fff4e5;
}

.toolbar-right :deep(.batch-action-btn--danger:hover),
.toolbar-right :deep(.batch-action-btn--danger:focus) {
  color: #a85700;
  border-color: #e7a84e;
  background: #ffecd1;
}

.toolbar-right :deep(.batch-action-btn.is-disabled),
.toolbar-right :deep(.batch-action-btn.is-disabled:hover),
.toolbar-right :deep(.batch-action-btn.is-disabled:focus) {
  color: var(--el-disabled-text-color);
  border-color: var(--el-disabled-border-color);
  background: var(--el-fill-color-light);
}

.search-input {
  width: 200px;
}

.select-sm {
  width: 130px;
}

.table-wrap {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.status-tag.is-success {
  color: #2f8f5b;
  background: #eaf7f0;
  border-color: #b7e1c6;
}

.status-tag.is-danger {
  color: #dc2626;
  background: #fdecec;
  border-color: #f5b5b5;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
}
</style>
