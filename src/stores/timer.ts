import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TimerService } from '@/services/timer'
import { onMessage } from '@/services/broadcast'
import type { ID } from '@/entities'

export const useTimerStore = defineStore('timer', () => {
  const activeTaskId = ref<ID | null>(null)
  const startedAt = ref<Date | null>(null)
  const elapsed = ref(0)  // segundos
  let interval: ReturnType<typeof setInterval> | null = null

  const isRunning = computed(() => activeTaskId.value !== null)
  const elapsedFormatted = computed(() => {
    const h = Math.floor(elapsed.value / 3600)
    const m = Math.floor((elapsed.value % 3600) / 60)
    const s = elapsed.value % 60
    return h > 0
      ? `${h}:${pad(m)}:${pad(s)}`
      : `${pad(m)}:${pad(s)}`
  })

  function pad(n: number) { return String(n).padStart(2, '0') }

  function _startTick(from: Date) {
    if (interval) clearInterval(interval)
    elapsed.value = Math.floor((Date.now() - from.getTime()) / 1000)
    interval = setInterval(() => { elapsed.value++ }, 1000)
  }

  function _stopTick() {
    if (interval) { clearInterval(interval); interval = null }
    elapsed.value = 0
    startedAt.value = null
    activeTaskId.value = null
  }

  async function toggle(taskId: ID) {
    if (activeTaskId.value === taskId) {
      await TimerService.stop(taskId)
      _stopTick()
    } else {
      const result = await TimerService.start(taskId)
      if (result.ok) {
        activeTaskId.value = taskId
        startedAt.value = new Date()
        _startTick(startedAt.value)
      }
    }
  }

  /** Recovery ao recarregar a página */
  async function recover() {
    const taskId = await TimerService.recover()
    if (!taskId) return
    // Encontra a entry aberta para calcular elapsed correto
    const { db } = await import('@/db')
    const entries = await db.timeEntries.where('taskId').equals(taskId).toArray()
    const open = entries.find(e => !e.endedAt)
    if (open) {
      activeTaskId.value = taskId
      startedAt.value = new Date(open.startedAt)
      _startTick(startedAt.value)
    }
  }

  // Sincroniza entre abas via BroadcastChannel
  onMessage(msg => {
    if (msg.type === 'TIMER_STOPPED' && msg.taskId === activeTaskId.value) _stopTick()
    if (msg.type === 'TIMER_STARTED' && msg.taskId !== activeTaskId.value) _stopTick()
  })

  return { activeTaskId, elapsed, elapsedFormatted, isRunning, toggle, recover }
})
