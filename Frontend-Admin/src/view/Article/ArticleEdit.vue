<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useArticleStore } from '@/stores'
import { uploadFile } from '@/api/settings'
import { MdEditor } from 'md-editor-v3'
import EmojiPicker from '@/components/EmojiPicker.vue'
import 'md-editor-v3/lib/style.css'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  id: null,
  title: '',
  slug: '',
  summary: '',
  coverImage: '',
  categoryId: null,
  tagIds: [],
  contentMarkdown: '',
  contentHtml: '',
  isPublished: 0
})

/* ---- 同步编辑器渲染后的 HTML ---- */
const onHtmlChanged = (html) => {
  form.value.contentHtml = html
}

/* ---- 同步编辑器内容（绕过 composition 阻塞，修复中文标点输入延迟） ---- */
const onContentChange = (md) => {
  form.value.contentMarkdown = md
}

const saving = ref(false)
const uploadingCover = ref(false)
const wordCount = computed(() => form.value.contentMarkdown.trim().length)
const editorPanelRef = ref(null)
const mdEditorRef = ref(null)

let editorRefreshTimer = null
let resizeObserver = null
let previewObserver = null
let suppressResizeRefreshUntil = 0
let lastEditorPanelRect = null
const previewImageListeners = new Map()

const cleanupPreviewImageListeners = () => {
  previewImageListeners.forEach((handler, img) => {
    img.removeEventListener('load', handler)
    img.removeEventListener('error', handler)
  })
  previewImageListeners.clear()
}

const cleanupPreviewObserver = () => {
  previewObserver?.disconnect()
  previewObserver = null
  cleanupPreviewImageListeners()
}

const scheduleEditorRefresh = () => {
  if (editorRefreshTimer) {
    window.clearTimeout(editorRefreshTimer)
  }

  editorRefreshTimer = window.setTimeout(async () => {
    suppressResizeRefreshUntil = Date.now() + 400
    mdEditorRef.value?.rerender?.()
    await nextTick()
    initPreviewSyncWatchers()
  }, 120)
}

const bindPreviewImageListeners = () => {
  const preview = editorPanelRef.value?.querySelector('.md-editor-preview')
  if (!preview) return

  const images = new Set(preview.querySelectorAll('img'))

  previewImageListeners.forEach((handler, img) => {
    if (images.has(img)) return
    img.removeEventListener('load', handler)
    img.removeEventListener('error', handler)
    previewImageListeners.delete(img)
  })

  images.forEach((img) => {
    if (previewImageListeners.has(img) || img.complete) return

    const handler = () => {
      img.removeEventListener('load', handler)
      img.removeEventListener('error', handler)
      previewImageListeners.delete(img)
      scheduleEditorRefresh()
    }

    previewImageListeners.set(img, handler)
    img.addEventListener('load', handler, { once: true })
    img.addEventListener('error', handler, { once: true })
  })
}

const initPreviewSyncWatchers = async () => {
  cleanupPreviewObserver()
  await nextTick()

  const preview = editorPanelRef.value?.querySelector('.md-editor-preview')
  if (!preview) return

  bindPreviewImageListeners()

  previewObserver = new MutationObserver(() => {
    bindPreviewImageListeners()
  })

  previewObserver.observe(preview, {
    childList: true,
    subtree: true
  })
}

const initEditorResizeObserver = () => {
  resizeObserver?.disconnect()

  if (!editorPanelRef.value || typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return

    const width = Math.round(entry.contentRect.width)
    const height = Math.round(entry.contentRect.height)

    if (!width || !height) return

    if (!lastEditorPanelRect) {
      lastEditorPanelRect = { width, height }
      return
    }

    const widthChanged = Math.abs(width - lastEditorPanelRect.width) > 1
    const heightChanged = Math.abs(height - lastEditorPanelRect.height) > 1

    lastEditorPanelRect = { width, height }

    if (!widthChanged && !heightChanged) return
    if (Date.now() < suppressResizeRefreshUntil) return

    scheduleEditorRefresh()
  })

  resizeObserver.observe(editorPanelRef.value)
}

/* ---- 图片上传（md-editor-v3 回调格式） ---- */
const onUploadImg = async (files, callback) => {
  try {
    const urls = await Promise.all(
      files.map(async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await uploadFile(fd)
        return res.data
      })
    )
    callback(urls)
    ElMessage.success('图片上传成功')
  } catch {
    ElMessage.error('图片上传失败')
    callback([])
  }
}

/* ---- 封面上传 ---- */
const handleCoverUpload = async (options) => {
  uploadingCover.value = true
  try {
    const fd = new FormData()
    fd.append('file', options.file)
    const res = await uploadFile(fd)
    form.value.coverImage = res.data
    ElMessage.success('封面上传成功')
  } finally {
    uploadingCover.value = false
  }
}

/* ---- 标题失焦自动生成 slug ---- */
const autoSlug = () => {
  if (form.value.title && !form.value.slug) {
    form.value.slug =
      form.value.title
        .toLowerCase()
        .replace(/[\u4e00-\u9fff]+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) || `article-${Date.now()}`
  }
}

/* ---- 快捷插入 emoji ---- */
const insertEditorEmoji = (char) => {
  const textarea = editorPanelRef.value?.querySelector('textarea')
  if (!textarea) {
    form.value.contentMarkdown += char
    return
  }

  const start = textarea.selectionStart ?? form.value.contentMarkdown.length
  const end = textarea.selectionEnd ?? form.value.contentMarkdown.length
  const val = form.value.contentMarkdown
  form.value.contentMarkdown = val.slice(0, start) + char + val.slice(end)

  nextTick(() => {
    const pos = start + char.length
    textarea.setSelectionRange(pos, pos)
    textarea.focus()
  })
}

/* ---- 保存 / 发布 ---- */
const isSaved = ref(false)
const handleSave = async (
  isPublished,
  { redirectAfterSave = isPublished === 1 } = {}
) => {
  if (!form.value.title.trim()) return ElMessage.warning('请输入文章标题')
  if (!form.value.slug.trim())
    return ElMessage.warning('请输入 URL 标识 (Slug)')
  if (!form.value.contentMarkdown.trim())
    return ElMessage.warning('请输入文章内容')
  if (!form.value.categoryId) return ElMessage.warning('请选择文章分类')
  if (saving.value) return
  saving.value = true
  try {
    form.value.isPublished = isPublished
    await articleStore.saveArticle({ ...form.value })
    isSaved.value = isPublished === 1 && redirectAfterSave
    takeSnapshot()
    ElMessage.success(isPublished ? '发布成功' : '保存草稿成功')
    if (redirectAfterSave) {
      router.push('/article/list')
    }
  } finally {
    saving.value = false
  }
}

/* ---- Ctrl/Cmd + S 保存草稿 ---- */
const onKeydownSave = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    handleSave(0, { redirectAfterSave: false })
  }
}

/* ---- 内容变更检测 & 离开提示 ---- */
const initialSnapshot = ref('')
const hasUnsavedChanges = () => {
  if (isSaved.value) return false
  const current = JSON.stringify({
    title: form.value.title,
    slug: form.value.slug,
    summary: form.value.summary,
    coverImage: form.value.coverImage,
    categoryId: form.value.categoryId,
    tagIds: form.value.tagIds,
    contentMarkdown: form.value.contentMarkdown
  })
  return current !== initialSnapshot.value
}

const takeSnapshot = () => {
  initialSnapshot.value = JSON.stringify({
    title: form.value.title,
    slug: form.value.slug,
    summary: form.value.summary,
    coverImage: form.value.coverImage,
    categoryId: form.value.categoryId,
    tagIds: form.value.tagIds,
    contentMarkdown: form.value.contentMarkdown
  })
}

onBeforeRouteLeave(async () => {
  if (!hasUnsavedChanges()) return true
  try {
    await ElMessageBox.confirm('你有未保存的内容，是否保存为草稿？', '提示', {
      confirmButtonText: '保存草稿',
      cancelButtonText: '不保存',
      distinguishCancelAndClose: true,
      type: 'warning'
    })
    // 用户点击保存草稿
    await handleSave(0, { redirectAfterSave: false })
    return true
  } catch (action) {
    if (action === 'cancel') {
      // 用户点击不保存，直接离开
      return true
    }
    // 用户点击关闭按钮，留在当前页面
    return false
  }
})

onMounted(async () => {
  window.addEventListener('keydown', onKeydownSave)
  await Promise.all([articleStore.fetchCategories(), articleStore.fetchTags()])
  if (isEdit.value) {
    const res = await articleStore.fetchDetail(route.params.id)
    if (res) {
      Object.assign(form.value, {
        id: res.id,
        title: res.title ?? '',
        slug: res.slug ?? '',
        summary: res.summary ?? '',
        coverImage: res.coverImage ?? '',
        categoryId: res.categoryId,
        tagIds: res.tagIds ?? [],
        contentMarkdown: res.contentMarkdown || res.contentHtml || '',
        isPublished: res.isPublished ?? 0
      })
    }
  }
  takeSnapshot()
  initEditorResizeObserver()
  initPreviewSyncWatchers()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownSave)
  if (editorRefreshTimer) {
    window.clearTimeout(editorRefreshTimer)
  }
  resizeObserver?.disconnect()
  cleanupPreviewObserver()
})
</script>

<template>
  <div class="article-edit">
    <!-- 顶部操作栏 -->
    <div class="edit-topbar">
      <span class="edit-title">{{ isEdit ? '编辑文章' : '新建文章' }}</span>

      <div class="edit-actions">
        <el-button size="small" @click="router.push('/article/list')"
          >取消</el-button
        >
        <el-button size="small" :loading="saving" @click="handleSave(0)"
          >保存草稿</el-button
        >
        <el-button
          size="small"
          type="primary"
          :loading="saving"
          @click="handleSave(1)"
          >发布</el-button
        >
      </div>
    </div>

    <!-- 标题行 -->
    <div class="title-row">
      <el-input
        v-model="form.title"
        placeholder="请输入文章标题…"
        class="title-input"
        size="large"
        @blur="autoSlug"
      />
    </div>

    <!-- 主体区域 -->
    <div class="edit-body">
      <!-- Markdown 编辑器 -->
      <div ref="editorPanelRef" class="editor-panel">
        <div class="editor-toolbar-emoji">
          <EmojiPicker @select="insertEditorEmoji" />
        </div>
        <MdEditor
          ref="mdEditorRef"
          v-model="form.contentMarkdown"
          preview-theme="github"
          :toolbars-exclude="['mermaid', 'katex', 'github']"
          class="md-editor-fill"
          @on-upload-img="onUploadImg"
          @on-html-changed="onHtmlChanged"
          @on-remount="initPreviewSyncWatchers"
          @on-change="onContentChange"
        />
      </div>

      <!-- 元数据侧边栏 -->
      <aside class="edit-aside">
        <div class="aside-mobile-head">
          <div>
            <span class="aside-mobile-title">发布设置</span>
            <span class="aside-mobile-desc">完善分类、标签与封面</span>
          </div>
          <span class="mobile-word-count">{{ wordCount }} 字</span>
        </div>

        <div class="aside-section">
          <div class="aside-label">Slug <span class="req">*</span></div>
          <el-input
            v-model="form.slug"
            placeholder="URL 路径标识"
            clearable
            size="small"
          />
        </div>

        <div class="aside-section section-summary">
          <div class="aside-label">摘要</div>
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="文章摘要（选填）"
            size="small"
          />
        </div>

        <div class="aside-section">
          <div class="aside-label">分类 <span class="req">*</span></div>
          <el-select
            v-model="form.categoryId"
            placeholder="选择分类"
            style="width: 100%"
            size="small"
          >
            <el-option
              v-for="c in articleStore.categories"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </div>

        <div class="aside-section">
          <div class="aside-label">标签</div>
          <el-select
            v-model="form.tagIds"
            multiple
            placeholder="选择标签"
            style="width: 100%"
            size="small"
          >
            <el-option
              v-for="t in articleStore.tags"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            />
          </el-select>
        </div>

        <div class="aside-section section-cover">
          <div class="aside-label">封面图</div>
          <el-upload
            :show-file-list="false"
            :http-request="handleCoverUpload"
            accept="image/*"
            class="cover-uploader"
          >
            <img
              v-if="form.coverImage"
              :src="form.coverImage"
              class="cover-preview"
            />
            <div v-else class="cover-placeholder">
              <span class="iconfont icon-image-fill" />
              <span>点击上传</span>
            </div>
          </el-upload>
          <el-input
            v-model="form.coverImage"
            placeholder="或直接输入图片 URL"
            clearable
            size="small"
            style="margin-top: 6px"
          />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.article-edit {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
}

/* ---- 顶栏 ---- */
.edit-topbar {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.edit-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.edit-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ---- 标题行 ---- */
.title-row {
  background: #fff;
  padding: 10px 16px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}
.title-input :deep(.el-input__inner) {
  font-size: 20px;
  font-weight: 600;
  border: none;
  box-shadow: none;
  padding-left: 0;
}

/* ---- 主体 ---- */
.edit-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 编辑器面板 */
.editor-panel {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar-emoji {
  position: absolute;
  left: 666px;
  top: 2px;
  z-index: 20;
}
.editor-toolbar-emoji :deep(.emoji-trigger) {
  width: 30px;
  height: 30px;
}
.editor-toolbar-emoji :deep(.emoji-panel) {
  top: 36px;
  bottom: auto;
  z-index: 3000;
}

/* md-editor-v3 填满面板高度 */
.md-editor-fill {
  flex: 1;
  height: 100% !important;
}

/* 去除编辑器默认边框，融入整体风格 */
.editor-panel :deep(.md-editor) {
  border: none;
  border-radius: 0;
  height: 100%;
}
.editor-panel :deep(.md-editor-toolbar-wrapper) {
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}
.editor-panel :deep(.md-editor-content) {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
}

/* 修复代码块头部 z-index 过高导致穿透 ElMessageBox 弹窗 */
.editor-panel :deep(.md-editor-code-head) {
  z-index: 1 !important;
}

/* 侧边栏 */
.edit-aside {
  width: 230px;
  flex-shrink: 0;
  overflow-y: auto;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  padding: 14px 12px;
}
.aside-mobile-head {
  display: none;
}
.aside-section {
  margin-bottom: 18px;
}
.aside-label {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 5px;
}
.req {
  color: #f56c6c;
}

/* 封面上传 */
.cover-uploader {
  width: 100%;
}
.cover-preview {
  width: 100%;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
  max-height: 110px;
}
.cover-placeholder {
  width: 100%;
  height: 78px;
  border: 1px dashed #d3d6db;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}
.cover-placeholder:hover {
  border-color: #303133;
  color: #303133;
}
.cover-placeholder .iconfont {
  font-size: 22px;
}

@media (max-width: 1024px) {
  .edit-body {
    flex-direction: column;
    overflow-y: auto;
  }

  .editor-panel {
    flex: 0 0 auto;
    height: 62vh;
    min-height: 460px;
  }

  .editor-toolbar-emoji {
    right: 8px;
    left: auto;
  }

  .edit-aside {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    overflow: visible;
    border-top: 1px solid #e4e7ed;
    border-left: none;
    padding: 14px;
  }

  .aside-section {
    min-width: 0;
    margin-bottom: 0;
  }

  .section-summary,
  .section-cover {
    grid-column: 1 / -1;
  }

  .cover-preview {
    max-height: 180px;
  }
}

@media (max-width: 768px) {
  .article-edit {
    height: 100%;
    overflow: hidden;
    background: #f6f7fb;
  }

  .edit-topbar {
    min-height: 50px;
    padding: 7px 10px;
    gap: 10px;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
  }

  .edit-actions {
    gap: 6px;
  }

  .edit-actions .el-button {
    min-height: 34px;
    margin-left: 0;
    border-radius: 8px;
  }

  .title-row {
    position: relative;
    z-index: 2;
    padding: 10px 12px 12px;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
  }

  .title-input :deep(.el-input__inner) {
    min-height: 40px;
    font-size: 19px;
    line-height: 1.35;
  }

  .edit-body {
    display: block;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 10px 18px;
    -webkit-overflow-scrolling: touch;
  }

  .editor-panel {
    height: min(68vh, 640px);
    min-height: 500px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .editor-panel :deep(.md-editor-toolbar) {
    min-width: max-content;
  }

  .editor-panel :deep(.md-editor-toolbar-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    background: #fff;
    border-bottom-color: #eef0f4;
    scrollbar-width: none;
  }

  .editor-panel :deep(.md-editor-toolbar-wrapper::-webkit-scrollbar) {
    display: none;
  }

  .editor-panel :deep(.md-editor-toolbar-item) {
    min-width: 36px;
    height: 36px;
  }

  .editor-panel :deep(.md-editor-content) {
    font-size: 15px;
    line-height: 1.75;
  }

  .editor-panel :deep(.cm-content),
  .editor-panel :deep(textarea) {
    font-size: 15px;
    line-height: 1.75;
  }

  .editor-panel :deep(.md-editor-footer) {
    min-height: 30px;
    background: #fff;
  }

  .editor-toolbar-emoji {
    top: 4px;
    right: 8px;
  }

  .edit-aside {
    grid-template-columns: 1fr;
    gap: 13px;
    margin-top: 12px;
    padding: 14px 12px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  }

  .aside-mobile-head {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 2px;
  }

  .aside-mobile-head > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }

  .aside-mobile-title {
    color: #303133;
    font-size: 15px;
    font-weight: 700;
  }

  .aside-mobile-desc {
    color: #909399;
    font-size: 12px;
    line-height: 1.4;
  }

  .mobile-word-count {
    flex-shrink: 0;
    border-radius: 999px;
    background: #f2f4f8;
    color: #606266;
    padding: 4px 9px;
    font-size: 12px;
    font-weight: 600;
  }

  .aside-label {
    margin-bottom: 7px;
    font-size: 13px;
  }

  .edit-aside :deep(.el-input__wrapper),
  .edit-aside :deep(.el-select__wrapper),
  .edit-aside :deep(.el-textarea__inner) {
    min-height: 38px;
    border-radius: 8px;
  }

  .edit-aside :deep(.el-textarea__inner) {
    min-height: 92px !important;
  }

  .section-summary,
  .section-cover {
    grid-column: auto;
  }
}

@media (max-width: 520px) {
  .edit-topbar {
    align-items: center;
    flex-wrap: nowrap;
  }

  .edit-title {
    width: auto;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-actions {
    width: auto;
    flex-shrink: 0;
    display: flex;
  }

  .edit-actions .el-button {
    width: auto;
    min-width: 46px;
    padding-right: 9px;
    padding-left: 9px;
    font-size: 12px;
  }

  .editor-panel {
    height: calc(100dvh - 194px);
    min-height: 460px;
  }

  .editor-panel :deep(.md-editor-input-wrapper),
  .editor-panel :deep(.md-editor-preview-wrapper) {
    padding: 12px 10px;
  }

  .editor-panel :deep(.md-editor-content) {
    font-size: 14px;
  }

  .cover-placeholder {
    height: 118px;
  }

  .cover-preview {
    max-height: 220px;
  }
}
</style>
