import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTasksStore } from './tasks'

export type TimelineView = 'daily' | 'weekly' | 'monthly'

export const useTimelineStore = defineStore('timeline', () => {
  const view = ref<TimelineView>('daily')
  const currentDate = ref(new Date())

  const currentDateLabel = computed(() => {
    if (view.value === 'daily') {
      return currentDate.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    if (view.value === 'weekly') {
      const start = getWeekStart(currentDate.value)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  })

  function navigate(delta: number) {
    const d = new Date(currentDate.value)
    if (view.value === 'daily') d.setDate(d.getDate() + delta)
    else if (view.value === 'weekly') d.setDate(d.getDate() + delta * 7)
    else d.setMonth(d.getMonth() + delta)
    currentDate.value = d
  }

  function goToday() {
    currentDate.value = new Date()
  }

  function getWeekStart(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  }

  function getWeekDays() {
    const start = getWeekStart(currentDate.value)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }

  // Tasks scheduled for the current view
  const tasksStore = useTasksStore()
  const scheduledTasks = computed(() => {
    return tasksStore.tasks.filter(t => {
      if (!t.dueAt) return false
      const due = new Date(t.dueAt)
      if (view.value === 'daily') return isSameDay(due, currentDate.value)
      if (view.value === 'weekly') {
        const days = getWeekDays()
        return days.some(d => isSameDay(due, d))
      }
      return due.getMonth() === currentDate.value.getMonth() && due.getFullYear() === currentDate.value.getFullYear()
    })
  })

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  }

  return { view, currentDate, currentDateLabel, scheduledTasks, navigate, goToday, getWeekDays, isSameDay }
})
