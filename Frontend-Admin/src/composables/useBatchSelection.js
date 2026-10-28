import { computed, nextTick, ref } from 'vue'

/**
 * 当前页局部批选；调用者切页/刷新时清空选择，并把 tableRef 绑定到实际表格。
 * @param {() => object[]} getRows 当前页响应式数据读取函数
 * @returns {object} 表格引用、选中行、全选状态与选择操作
 */
export const useBatchSelection = (getRows) => {
  const tableRef = ref(null)
  const selected = ref([])

  const rows = computed(() => getRows?.() ?? [])
  const allSelected = computed(
    () => rows.value.length > 0 && selected.value.length === rows.value.length
  )

  const handleSelectionChange = (items) => {
    selected.value = items
  }

  const clearSelection = () => {
    tableRef.value?.clearSelection()
    selected.value = []
  }

  const toggleSelectAll = async () => {
    if (!tableRef.value || !rows.value.length) return

    if (allSelected.value) {
      clearSelection()
      return
    }

    tableRef.value.clearSelection()
    await nextTick()
    rows.value.forEach((row) => tableRef.value?.toggleRowSelection(row, true))
  }

  return {
    tableRef,
    selected,
    allSelected,
    handleSelectionChange,
    clearSelection,
    toggleSelectAll
  }
}
