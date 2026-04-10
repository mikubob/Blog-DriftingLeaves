import { computed, nextTick, ref } from 'vue'

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
