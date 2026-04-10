<template>
  <div class="flex flex-col h-full overflow-hidden bg-secondary border-r-3 border-ink" style="width: 320px; flex-shrink: 0">
    <!-- Header -->
    <div class="px-6 py-4 border-b-3 border-ink flex-shrink-0 bg-ink">
      <h2 class="text-[10px] font-bold text-white uppercase tracking-[0.2em] font-tech text-center">Unscheduled Units</h2>
    </div>

    <!-- Project groups -->
    <div class="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-4">
      <div v-for="group in groups" :key="group.projectId" class="flex flex-col">
        <!-- Project row -->
        <button
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink/20 transition-all border-b-2 border-ink/20 group"
          @click="toggle(group.projectId)"
        >
          <span
            class="text-[10px] text-white/40 transition-transform duration-150 flex-shrink-0"
            :class="isOpen(group.projectId) ? 'rotate-90' : ''"
          >▶</span>
          <span class="w-2 h-2 flex-shrink-0" :style="{ background: group.color }" />
          <span class="text-xs font-tech font-bold text-white uppercase tracking-widest truncate flex-1 text-left">{{ group.name }}</span>
          <Badge variant="outline" class="bg-ink text-white border-white/20 h-5 min-w-5">{{ group.tasks.length }}</Badge>
        </button>

        <!-- Task list -->
        <div v-if="isOpen(group.projectId)" class="flex flex-col gap-2 mt-3 pl-4">
          <div
            v-for="task in group.tasks"
            :key="task.id"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            @dragend="onDragEnd"
            class="flex flex-col gap-2 p-3 bg-background border-2 border-ink shadow-[2px_2px_0px_0px_#0D0D0D] cursor-grab active:cursor-grabbing
                   transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#0D0D0D]"
            :class="draggingId === task.id ? 'opacity-20 translate-x-1' : ''"
          >
            <div class="flex items-start gap-3">
              <span class="w-1.5 h-1.5 flex-shrink-0 mt-1" :style="{ background: group.color }" />
              <div class="min-w-0 flex-1 flex flex-col">
                <span
                  class="text-xs font-bold truncate leading-tight"
                  :class="task.dueAt ? 'text-ink/40 italic' : 'text-ink'"
                >{{ task.title }}</span>
                <span v-if="task.parentId" class="text-[9px] font-tech uppercase tracking-wider text-ink/45 truncate">
                  subtask · {{ parentTitle(task) }}
                </span>
              </div>
            </div>

            <!-- Metadata -->
            <div class="flex items-center gap-2 mt-1 font-tech uppercase tracking-widest text-[8px] font-bold">
              <span v-if="task.dueAt" class="text-primary">
                Agendado: {{ formatDueAt(task.dueAt) }}
              </span>
              <span v-else class="text-ink/40">Not Sequenced</span>
              <span v-if="task.priority !== 'none'" class="ml-auto" :class="priorityColor[task.priority]">
                {{ task.priority }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="groups.length === 0" class="px-6 py-12 text-center">
        <div class="border-3 border-white/10 border-dashed p-6">
          <p class="text-[10px] font-tech font-bold uppercase tracking-widest text-white/30">Sector Cleared: No Units Found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { Badge } from '@/components/ui/badge'
import type { Task } from '@/entities'

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()

const draggingId = ref<number | null>(null)
// Guarda quais projectIds estão abertos — fechado por padrão
const openProjects = ref<Set<number>>(new Set())

const priorityColor: Record<string, string> = {
  low: 'text-secondary',
  medium: 'text-tertiary',
  high: 'text-primary',
}

const taskById = computed(() => {
  const map = new Map<number, Task>()
  for (const task of tasksStore.tasks) {
    if (task.id) map.set(task.id, task)
  }
  return map
})

function parentTitle(task: Task) {
  if (!task.parentId) return ''
  return taskById.value.get(task.parentId)?.title ?? ''
}

// Todas as tasks ativas (incluindo subtasks), agrupadas por projeto
const groups = computed(() => {
  const activeTasks = tasksStore.tasks.filter(
    t => t.status !== 'done' && t.status !== 'archived'
  )

  const map = new Map<number, Task[]>()
  for (const task of activeTasks) {
    const list = map.get(task.projectId) ?? []
    list.push(task)
    map.set(task.projectId, list)
  }

  // Segue a ordem de projectsStore.projects para consistência com o sidebar nav
  return projectsStore.projects
    .map(project => ({
      projectId: project.id!,
      name: project.name,
      color: project.color,
      tasks: map.get(project.id!) ?? [],
    }))
    .filter(g => g.tasks.length > 0)
})

function isOpen(projectId: number) {
  return openProjects.value.has(projectId)
}

function toggle(projectId: number) {
  if (openProjects.value.has(projectId)) {
    openProjects.value.delete(projectId)
  } else {
    openProjects.value.add(projectId)
  }
}

function formatDueAt(dueAt: Date) {
  return format(new Date(dueAt), 'MMM d, HH:mm')
}

function onDragStart(e: DragEvent, task: Task) {
  draggingId.value = task.id!
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('application/task-id', String(task.id))
}

function onDragEnd() {
  draggingId.value = null
}
</script>
