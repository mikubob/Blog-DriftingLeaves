<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/stores'
import { useBatchSelection } from '@/composables/useBatchSelection'
import dayjs from 'dayjs'

const router = useRouter()
const articleStore = useArticleStore()

const searchForm = ref({ title: '', categoryId: '', isPublished: '' })
const page = ref(1)
const size = ref(15)

const {
  tableRef,
  selected,
  allSelected,
  handleSelectionChange,
  clearSelection,
  toggleSelectAll
} = useBatchSelection(() => articleStore.list)

const load = () => {
  articleStore.fetchList({
    page: page.value,
    pageSize: size.value,
    ...searchForm.value
  })
  articleStore.fetchCategories()
}

const handleSearch = () => {
  page.value = 1
  clearSelection()
  load()
}

const handleReset = () => {
  searchForm.value = { title: '', categoryId: '', isPublished: '' }
  handleSearch()
}

const handlePageChange = (p) => {
  page.value = p
  load()
}

const handleSizeChange = (s) => {
  size.value = s
  page.value = 1
  load()
}

const viewDialogVisible = ref(false)
const viewRow = ref(null)
const viewLoading = ref(false)

const toEdit = (id) => {
  viewDialogVisible.value = false
  router.push(id ? `/article/edit/${id}` : '/article/edit')
}

const toCreate = () => router.push('/article/edit')

const openView = async (row) => {
  viewDialogVisible.value = true
  viewLoading.value = true
  try {
    const detail = await articleStore.fetchDetail(row.id)
    viewRow.value = detail
  } finally {
    viewLoading.value = false
  }
}

const togglePublish = async (row) => {
  await articleStore.toggleArticlePublish(row.id, row.isPublished ? 0 : 1)
  load()
}

const toggleTop = async (row) => {
  await articleStore.toggleArticleTop(row.id, row.isTop ? 0 : 1)
  load()
}

const deleteOne = async (row) => {
  await ElMessageBox.confirm(`确认删除文章《${row.title}》？`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await articleStore.removeArticles([row.id])
  ElMessage.success('删除成功')
  load()
}

const batchDelete = async () => {
  if (!selected.value.length) return ElMessage.warning('请先选择文章')
  await ElMessageBox.confirm(
    `确认删除选中的 ${selected.value.length} 篇文章？`,
    '警告',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  await articleStore.removeArticles(selected.value.map((r) => r.id))
  clearSelection()
  ElMessage.success('批量删除成功')
  load()
}

const fmtDate = (d) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-')

const publishStatusClass = (isPublished) =>
  isPublished ? 'status-tag is-success' : 'status-tag is-warning'

const topStatusClass = (isTop) =>
  isTop ? 'status-tag is-top' : 'status-tag is-muted'

onMounted(load)
</script>

<template>
  <div class="article-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchForm.title"
          placeholder="搜索文章标题"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <span class="iconfont icon-search" />
          </template>
        </el-input>
        <el-select
          v-model="searchForm.categoryId"
          placeholder="全部分类"
          clearable
          class="select-sm"
        >
          <el-option
            v-for="c in articleStore.categories"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
        </el-select>
        <el-select
          v-model="searchForm.isPublished"
          placeholder="全部状态"
          clearable
          class="select-sm"
        >
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
        </el-select>
        <el-button @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button
          plain
          :disabled="!articleStore.list.length"
          @click="toggleSelectAll"
        >
          {{ allSelected ? '取消全选' : '全选当前页' }}
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
        <el-button type="primary" @click="toCreate">
          <span class="iconfont icon-plus" />
          新建文章
        </el-button>
      </div>
    </div>

    <div class="table-wrap" v-loading="articleStore.loading">
      <el-table
        ref="tableRef"
        :data="articleStore.list"
        border
        stripe
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column
          prop="title"
          label="标题"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column
          prop="slug"
          label="Slug"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="publishStatusClass(row.isPublished)">
              {{ row.isPublished ? '已发布' : '草稿' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="置顶" width="75" align="center">
          <template #default="{ row }">
            <span :class="topStatusClass(row.isTop)">
              {{ row.isTop ? '置顶' : '普通' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="viewCount"
          label="阅读"
          width="75"
          align="center"
        />
        <el-table-column
          prop="commentCount"
          label="评论"
          width="75"
          align="center"
        />
        <el-table-column label="发布时间" width="160" align="center">
          <template #default="{ row }">
            {{ fmtDate(row.publishTime || row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link size="small" @click="openView(row)"
                >预览</el-button
              >
              <el-divider direction="vertical" />
              <el-button link size="small" @click="togglePublish(row)">
                {{ row.isPublished ? '撤回' : '发布' }}
              </el-button>
              <el-divider direction="vertical" />
              <el-button link size="small" @click="toggleTop(row)">
                {{ row.isTop ? '取消置顶' : '置顶' }}
              </el-button>
              <el-divider direction="vertical" />
              <el-button link size="small" @click="toEdit(row.id)"
                >编辑</el-button
              >
              <el-divider direction="vertical" />
              <el-button link size="small" type="danger" @click="deleteOne(row)"
                >删除</el-button
              >
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
        :total="articleStore.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="viewDialogVisible"
      :title="viewRow?.title ?? '文章预览'"
      width="760px"
      top="5vh"
    >
      <div
        v-loading="viewLoading"
        class="article-preview"
        v-html="viewRow?.contentHtml ?? (viewLoading ? '' : '<p>暂无内容</p>')"
      />
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="toEdit(viewRow?.id)"
          >去编辑</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.article-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
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
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  width: 220px;
}

.select-sm {
  width: 130px;
}

.toolbar-left .iconfont,
.toolbar-right .iconfont {
  font-size: 14px;
  margin-right: 4px;
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
  min-width: 44px;
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

.status-tag.is-warning {
  color: #b45309;
  background: #fff3e6;
  border-color: #f5cf9f;
}

.status-tag.is-top {
  color: #7c3aed;
  background: #f3e8ff;
  border-color: #d8b4fe;
}

.status-tag.is-muted {
  color: #6b7280;
  background: #f3f4f6;
  border-color: #d1d5db;
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

.article-preview {
  padding: 8px 4px;
  line-height: 1.8;
  font-size: 15px;
  color: #303133;
  max-height: 70vh;
  overflow-y: auto;
}

.article-preview :deep(h1),
.article-preview :deep(h2),
.article-preview :deep(h3) {
  font-weight: 600;
  margin: 16px 0 8px;
}

.article-preview :deep(p) {
  margin: 8px 0;
}

.article-preview :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.article-preview :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.article-preview :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}
</style>
