import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ID } from '@/entities'

export const useUIStore = defineStore('ui', () => {
  const sidebarWidth = ref(240)
  const activeTaskId = ref<ID | null>(null)

  function openTask(id: ID) { activeTaskId.value = id }
  function closeTask() { activeTaskId.value = null }

  return { sidebarWidth, activeTaskId, openTask, closeTask }
})
