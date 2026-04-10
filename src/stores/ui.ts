import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ID } from '@/entities'

export const useUIStore = defineStore('ui', () => {
  const sidebarWidth = ref(240)
  const activeTaskId = ref<ID | null>(null)
  const themeComboIndex = ref(0)
  const themePresets = [
    {
      name: 'Default',
      projectColors: ['#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#eab308'],
      tokens: {
        primary: '355 100% 28%',
        secondary: '295 14% 39%',
        tertiary: '20 100% 24%',
      },
    },
    {
      name: 'Sunset',
      projectColors: ['#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'],
      tokens: {
        primary: '16 89% 58%',
        secondary: '335 79% 58%',
        tertiary: '262 83% 68%',
      },
    },
    {
      name: 'Steel',
      projectColors: ['#64748b', '#334155', '#0ea5e9', '#10b981', '#f59e0b'],
      tokens: {
        primary: '217 19% 35%',
        secondary: '215 28% 17%',
        tertiary: '198 89% 48%',
      },
    },
  ] as const
  const activeProjectColors = computed(() => themePresets[themeComboIndex.value].projectColors)

  function openTask(id: ID) { activeTaskId.value = id }
  function closeTask() { activeTaskId.value = null }
  function setThemeCombo(index: number) {
    if (index < 0 || index >= themePresets.length) return
    themeComboIndex.value = index
    applyTheme()
  }
  function cycleThemeCombo() {
    themeComboIndex.value = (themeComboIndex.value + 1) % themePresets.length
    applyTheme()
  }
  function applyTheme() {
    const root = document.documentElement
    const selected = themePresets[themeComboIndex.value]
    root.style.setProperty('--primary', selected.tokens.primary)
    root.style.setProperty('--secondary', selected.tokens.secondary)
    root.style.setProperty('--tertiary', selected.tokens.tertiary)
    localStorage.setItem('heavytodo-theme-index', String(themeComboIndex.value))
  }
  function loadTheme() {
    const raw = localStorage.getItem('heavytodo-theme-index')
    const idx = Number(raw)
    if (Number.isInteger(idx) && idx >= 0 && idx < themePresets.length) {
      themeComboIndex.value = idx
    } else {
      themeComboIndex.value = 0
    }
    applyTheme()
  }

  return {
    sidebarWidth,
    activeTaskId,
    themeComboIndex,
    themePresets,
    activeProjectColors,
    openTask,
    closeTask,
    setThemeCombo,
    cycleThemeCombo,
    loadTheme,
  }
})
