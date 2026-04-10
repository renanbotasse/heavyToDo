<template>
  <div class="flex gap-3 h-full overflow-x-auto px-6 py-4">
    <KanbanColumn
      v-for="col in columns" :key="col.status"
      :status="col.status"
      :label="col.label"
      :tasks="tasksByStatus[col.status]"
      :project-id="projectId"
      @task-moved="onTaskMoved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import KanbanColumn from './KanbanColumn.vue'
import type { Task, ID } from '@/entities'

const props = defineProps<{ projectId: ID }>()
const tasksStore = useTasksStore()

const columns: { status: Task['status']; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
  { status: 'archived', label: 'Archived' },
]

// computed garante que qualquer mudança no store re-deriva as 4 colunas de uma vez
const tasksByStatus = computed(() => {
  const all = tasksStore.getByProject(props.projectId)
  return {
    todo:        all.filter(t => t.status === 'todo'),
    in_progress: all.filter(t => t.status === 'in_progress'),
    done:        all.filter(t => t.status === 'done'),
    archived:    all.filter(t => t.status === 'archived'),
  }
})

async function onTaskMoved(taskId: ID, newStatus: Task['status']) {
  if (newStatus === 'done') await tasksStore.complete(taskId)
  else await tasksStore.update(taskId, { status: newStatus })
}
</script>
