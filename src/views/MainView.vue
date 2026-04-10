<template>
  <div class="flex h-screen bg-parchment overflow-hidden selection:bg-primary selection:text-white">
    <!-- Sidebar Container -->
    <div class="flex-shrink-0 bg-secondary border-r-3 border-ink overflow-hidden flex flex-col"
      :style="{ width: uiStore.sidebarWidth + 'px' }">
      <AppSidebar />
    </div>

    <!-- Resizer Handle (Brutalist Style) -->
    <div
      class="w-4 flex-shrink-0 cursor-col-resize transition-all hover:bg-ink group relative z-50 overflow-hidden"
      @mousedown="startResize"
    >
      <div class="absolute inset-0 hatched-divider-vertical opacity-20 group-hover:opacity-50"></div>
    </div>

    <!-- Core Workspace -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Texture overlay for the main area -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style="background-image: repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px);">
      </div>

      <!-- Timer bar -->
      <TimerBar class="z-20" />

      <!-- High-Impact Dynamic Header -->
      <header class="flex-shrink-0 px-8 py-6 border-b-3 border-ink bg-parchment-container relative z-10">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[10px] font-bold font-tech uppercase tracking-[0.3em] text-ink/40 mb-1">Operational Sector</span>
            <h1 class="text-3xl font-display italic font-bold tracking-tight text-ink">{{ headerTitle }}</h1>
          </div>
          <div class="flex items-center gap-4">
             <!-- Asymmetric decoration -->
             <div class="w-12 h-1.5 bg-ink"></div>
             <div class="w-4 h-1.5 bg-primary"></div>
          </div>
        </div>
        <!-- Brutalist underline shadow -->
        <div class="absolute -bottom-[6px] left-0 w-full h-[3px] bg-ink opacity-20"></div>
      </header>

      <!-- Main viewport -->
      <main class="flex-1 overflow-hidden p-8 relative z-10">
        <RouterView />
      </main>
    </div>

    <!-- Task modal -->
    <TaskModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useTimerStore } from '@/stores/timer'
import { useTagsStore } from '@/stores/tags'
import { seedDefaults } from '@/db'
import AppSidebar from '@/components/sidebar/AppSidebar.vue'
import TimerBar from '@/components/timer/TimerBar.vue'
import TaskModal from '@/components/task/TaskModal.vue'

const uiStore = useUIStore()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const timerStore = useTimerStore()
const tagsStore = useTagsStore()
const route = useRoute()

const headerTitle = computed(() => {
  if (route.path === '/my-day') return 'Chronicler\'s Day'
  if (route.path === '/inbox') return 'Universal Inbox'
  if (route.path === '/timeline') return 'Temporal Sequence'
  if (route.path === '/reports') return 'Final Intelligence'
  if (route.path.startsWith('/projects/')) {
    const id = Number(route.params.id)
    return projectsStore.getById(id)?.name.toUpperCase() ?? 'OPERATIONAL SECTOR'
  }
  return 'INKWELL CORE'
})

onMounted(async () => {
  try {
    await seedDefaults()
    await Promise.all([
      tasksStore.load(),
      projectsStore.load(),
      tagsStore.load(),
    ])
    await timerStore.recover()
  } catch (e) {
    console.error('[boot] CRITICAL INITIALIZATION ERROR', e)
  }
})

function startResize(e: MouseEvent) {
  const startX = e.clientX
  const startW = uiStore.sidebarWidth
  document.body.style.cursor = 'col-resize'

  function onMove(me: MouseEvent) {
    uiStore.sidebarWidth = Math.max(220, Math.min(500, startW + me.clientX - startX))
  }

  function onUp() {
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
</script>
