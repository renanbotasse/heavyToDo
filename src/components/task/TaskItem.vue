<template>
  <div class="flex flex-col mb-2">
    <!-- Main task row -->
    <div
      class="group flex items-center justify-between p-4
             bg-card border-3 border-ink shadow-standard
             transition-all hover:-translate-y-1 hover:shadow-high-impact cursor-pointer relative overflow-hidden"
      :class="[
        task.status === 'done' || task.status === 'archived' ? 'bg-parchment-high opacity-80' : 'bg-white',
      ]"
      @click="uiStore.openTask(task.id!)"
    >
      <div class="flex items-center gap-4 min-w-0">
        <!-- Status checkbox (Neo-Brutalist Square) -->
        <button
          class="w-6 h-6 border-3 border-ink flex-shrink-0 flex items-center justify-center transition-all active:scale-95 bg-white"
          :class="task.status === 'done'
            ? 'bg-primary'
            : 'hover:bg-primary/10'"
          @click.stop="toggleStatus"
        >
          <span v-if="task.status === 'done'" class="text-white font-bold">X</span>
        </button>

        <div class="min-w-0">
          <h4
            class="text-lg font-bold text-ink truncate font-sans"
            :class="{ 'line-through decoration-primary decoration-4': task.status === 'done' }"
          >{{ task.title }}</h4>
          <div class="flex items-center gap-3 mt-1 font-tech uppercase tracking-widest text-[10px]">
            <span v-if="project" class="bg-ink text-white px-1.5 py-0.5">{{ project.name }}</span>
            <span v-if="task.dueAt" class="flex-shrink-0" :class="isOverdue ? 'text-primary font-bold animate-pulse' : 'text-ink/60'">
              {{ formatDate(task.dueAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hover actions -->
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
        <!-- Timer / play -->
        <button
          @click.stop="timerStore.toggle(task.id!)"
          class="px-2 py-1 border-2 border-ink bg-white font-tech text-xs hover:bg-ink hover:text-white transition-all shadow-[2px_2px_0px_0px_#0D0D0D]"
          title="Timer"
        >{{ timerStore.activeTaskId === task.id ? timerStore.elapsedFormatted : 'PLAY' }}</button>

        <!-- Due date -->
        <button
          @click.stop="dateInputRef?.click()"
          class="p-1 border-2 border-ink bg-white hover:bg-secondary hover:text-white transition-all shadow-[2px_2px_0px_0px_#0D0D0D]"
          title="Due date"
        >📅</button>
        <input
          type="date"
          ref="dateInputRef"
          class="sr-only"
          :value="dateInputValue"
          @change.stop="setDueDate"
        />

        <!-- Priority cycle -->
        <button
          @click.stop="cyclePriority"
          class="px-2 py-1 border-2 border-ink bg-white font-tech text-xs font-bold transition-all shadow-[2px_2px_0px_0px_#0D0D0D]"
          :class="priorityClass"
          title="Priority"
        >{{ priorityLabel }}</button>
      </div>
      
      <!-- Done background pattern -->
      <div v-if="task.status === 'done'" class="absolute inset-0 pointer-events-none opacity-[0.03]"
        style="background-image: repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px);">
      </div>
    </div>

    <!-- Inline subtasks -->
    <div v-if="subtasks.length > 0" class="flex flex-col">
      <div class="hatched-divider opacity-20 ml-8"></div>
      <div class="bg-parchment-high border-x-3 border-ink ml-8">
        <div
          v-for="sub in subtasks"
          :key="sub.id"
          class="flex items-center gap-3 px-4 py-3
                 hover:bg-parchment-highest transition-colors cursor-pointer border-b-2 border-ink/10 last:border-b-0"
          @click="uiStore.openTask(sub.id!)"
        >
          <button
            class="w-5 h-5 border-2 border-ink flex-shrink-0 flex items-center justify-center transition-all bg-white"
            :class="sub.status === 'done' ? 'bg-primary' : 'hover:bg-primary/10'"
            @click.stop="toggleSubStatus(sub)"
          >
            <span v-if="sub.status === 'done'" class="text-white text-[10px] font-bold">X</span>
          </button>
          <span
            class="text-sm font-bold truncate flex-1 font-sans"
            :class="sub.status === 'done' ? 'line-through text-ink/40' : 'text-ink'"
          >{{ sub.title }}</span>
          <span v-if="sub.dueAt" class="text-[10px] font-tech uppercase tracking-widest text-ink/50">{{ formatDate(sub.dueAt) }}</span>
        </div>
      </div>
      <div class="border-b-3 border-ink ml-8"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, isPast, isToday } from 'date-fns'
import { useTasksStore } from '@/stores/tasks'
import { useTimerStore } from '@/stores/timer'
import { useUIStore } from '@/stores/ui'
import { useProjectsStore } from '@/stores/projects'
import type { Task } from '@/entities'

const props = defineProps<{ task: Task }>()

const tasksStore = useTasksStore()
const timerStore = useTimerStore()
const uiStore = useUIStore()
const projectsStore = useProjectsStore()

const dateInputRef = ref<HTMLInputElement | null>(null)

const project = computed(() => props.task.projectId ? projectsStore.getById(props.task.projectId) : null)
const subtasks = computed(() => tasksStore.getSubtasks(props.task.id!))

const isOverdue = computed(() => {
  if (!props.task.dueAt || props.task.status === 'done') return false
  const d = new Date(props.task.dueAt)
  return isPast(d) && !isToday(d)
})

function formatDate(d: Date) {
  const date = new Date(d)
  if (isToday(date)) return 'Today'
  return format(date, 'MMM d')
}

async function toggleStatus() {
  if (props.task.status === 'done') {
    await tasksStore.update(props.task.id!, { status: 'todo', completedAt: undefined })
  } else {
    await tasksStore.complete(props.task.id!)
  }
}

async function toggleSubStatus(sub: Task) {
  if (sub.status === 'done') {
    await tasksStore.update(sub.id!, { status: 'todo', completedAt: undefined })
  } else {
    await tasksStore.complete(sub.id!)
  }
}

// Priority cycling
const priorities = ['none', 'low', 'medium', 'high'] as const

const priorityLabel = computed(() => {
  switch (props.task.priority) {
    case 'high':   return 'URGENT'
    case 'medium': return 'HIGH'
    case 'low':    return 'MED'
    default:       return 'LOW'
  }
})

const priorityClass = computed(() => {
  switch (props.task.priority) {
    case 'high':   return 'text-primary'
    case 'medium': return 'text-tertiary'
    case 'low':    return 'text-secondary'
    default:       return 'text-ink/40'
  }
})

async function cyclePriority() {
  const idx = priorities.indexOf(props.task.priority)
  const next = priorities[(idx + 1) % priorities.length]
  await tasksStore.update(props.task.id!, { priority: next })
}

// Due date quick set
const dateInputValue = computed(() => {
  if (!props.task.dueAt) return ''
  return format(new Date(props.task.dueAt), 'yyyy-MM-dd')
})

async function setDueDate(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!val) {
    await tasksStore.update(props.task.id!, { dueAt: undefined })
    return
  }
  const [y, mo, d] = val.split('-').map(Number)
  const existing = props.task.dueAt ? new Date(props.task.dueAt) : new Date()
  existing.setFullYear(y, mo - 1, d)
  await tasksStore.update(props.task.id!, { dueAt: existing })
}
</script>
