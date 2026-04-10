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
      <main class="flex-1 overflow-hidden p-8 pb-24 relative z-10">
        <RouterView />
      </main>

      <!-- Fixed footer -->
      <footer class="absolute bottom-0 left-0 right-0 z-20 border-t-3 border-ink bg-parchment-container/95 backdrop-blur-sm">
        <div class="px-8 py-3 flex items-center justify-between gap-4">
          <div class="text-xs font-tech font-bold uppercase tracking-widest text-ink/70">
            Built by Renan Botasse
          </div>
          <div class="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                class="h-8 px-3 border-2 border-ink bg-white text-[10px] font-tech font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
              >
                Theme
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" class="w-56 border-2 border-ink bg-white p-2">
                <DropdownMenuLabel class="text-[10px] font-tech uppercase tracking-widest text-ink/60">Theme Combo</DropdownMenuLabel>
                <DropdownMenuSeparator class="my-1 bg-ink/10" />
                <DropdownMenuItem
                  v-for="(preset, index) in uiStore.themePresets"
                  :key="index"
                  class="cursor-pointer flex items-center justify-between text-xs"
                  @click="selectThemeCombo(index)"
                >
                  <span class="font-tech uppercase tracking-widest">{{ preset.name }}</span>
                  <span class="flex items-center gap-1">
                    <span
                      v-for="color in preset.projectColors"
                      :key="color"
                      class="w-2.5 h-2.5 border border-ink/20"
                      :style="{ background: color }"
                    />
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <a
              href="https://github.com/renanbotasse"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-tech font-bold uppercase tracking-widest px-2 py-1 border border-ink/30 hover:border-ink hover:bg-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/renanbotasse/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-tech font-bold uppercase tracking-widest px-2 py-1 border border-ink/30 hover:border-ink hover:bg-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://hackernoon.com/u/renanb"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-tech font-bold uppercase tracking-widest px-2 py-1 border border-ink/30 hover:border-ink hover:bg-white transition-colors"
            >
              HackerNoon
            </a>
          </div>
        </div>
      </footer>
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    uiStore.loadTheme()
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

function selectThemeCombo(index: number) {
  uiStore.setThemeCombo(index)
}
</script>
