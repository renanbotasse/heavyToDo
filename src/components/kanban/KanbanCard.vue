<template>
  <div
    :data-task-id="task.id"
    class="group bg-white border-2 border-ink p-4 cursor-pointer
           transition-all shadow-[3px_3px_0px_0px_#0D0D0D] hover:shadow-[6px_6px_0px_0px_#0D0D0D] hover:-translate-y-0.5 active:shadow-none active:translate-y-0 relative overflow-hidden"
    @click="uiStore.openTask(task.id!)"
  >
    <!-- Done pattern overlay -->
    <div v-if="task.status === 'done'" class="absolute inset-0 pointer-events-none opacity-[0.03]"
      style="background-image: repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px);">
    </div>

    <!-- Título -->
    <h4 class="text-sm font-bold text-ink truncate mb-3"
      :class="{ 'line-through decoration-primary decoration-2': task.status === 'done' }">
      {{ task.title }}
    </h4>

    <!-- Meta row -->
    <div class="flex items-center gap-2 flex-wrap font-tech uppercase tracking-widest text-[9px] font-bold text-ink/60">
      <div v-if="task.priority !== 'none'" class="px-1.5 py-0.5 bg-ink text-white">
        {{ task.priority }}
      </div>
      <span v-if="task.dueAt" class="border-b border-ink/20">
        {{ formatDate(task.dueAt) }}
      </span>
      <span v-if="subtaskCount > 0" class="flex items-center gap-1">
        <span class="w-1.5 h-1.5 bg-primary"></span>
        {{ subtaskDone }}/{{ subtaskCount }} LIST
      </span>
      <span v-if="task.timeEstimateMin" class="ml-auto opacity-40">
        {{ task.timeEstimateMin }}M
      </span>
    </div>

    <!-- Progress bar if needed -->
    <div v-if="subtaskCount > 0" class="h-1 bg-parchment-high mt-3 relative overflow-hidden">
      <div class="h-full bg-primary transition-all duration-500" :style="{ width: (subtaskDone/subtaskCount * 100) + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { useUIStore } from '@/stores/ui'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/entities'

const props = defineProps<{ task: Task }>()
const uiStore = useUIStore()
const tasksStore = useTasksStore()

const subtasks = computed(() => tasksStore.getSubtasks(props.task.id!))
const subtaskCount = computed(() => subtasks.value.length)
const subtaskDone = computed(() => subtasks.value.filter(s => s.status === 'done').length)

function formatDate(d: Date) { return format(new Date(d), 'MMM d') }
</script>
