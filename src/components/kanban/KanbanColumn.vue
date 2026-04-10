<template>
  <div class="flex flex-col w-72 flex-shrink-0 bg-parchment-container border-3 border-ink shadow-standard overflow-hidden h-full">
    <!-- Column header -->
    <div class="flex items-center justify-between px-4 py-3 border-b-3 border-ink bg-ink text-white">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold font-tech uppercase tracking-widest">{{ label }}</span>
        <Badge variant="outline" class="bg-primary text-white border-white h-5 min-w-5">{{ tasks.length }}</Badge>
      </div>
    </div>

    <!-- Cards drop zone -->
    <VueDraggable
      v-model="localTasks"
      :group="{ name: 'kanban', pull: true, put: true }"
      item-key="id"
      class="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[200px]"
      @add="onAdd"
    >
      <template #item="{ element }">
        <KanbanCard :task="element" />
      </template>
    </VueDraggable>

    <!-- Add task shortcut -->
    <div class="px-3 py-3 border-t-3 border-ink bg-white">
      <Button
        v-if="!showAdd"
        @click="showAdd = true"
        variant="ghost"
        class="w-full text-[10px] uppercase font-bold tracking-tighter"
      >
        + NEW ENTRY
      </Button>
      <form v-else @submit.prevent="handleAdd" class="flex flex-col gap-2">
        <input v-model="newTitle" autofocus placeholder="Unit Title..."
          class="w-full bg-white text-ink text-xs px-2 py-1.5 outline-none border-b-2 border-primary" />
        <div class="flex gap-1 justify-end">
          <Button type="button" variant="ghost" size="sm" @click="showAdd = false">✕</Button>
          <Button type="submit" variant="default" size="sm">+</Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useTasksStore } from '@/stores/tasks'
import KanbanCard from './KanbanCard.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Task, ID } from '@/entities'

const props = defineProps<{
  status: Task['status']
  label: string
  tasks: Task[]
  projectId: ID
}>()

const emit = defineEmits<{
  (e: 'task-moved', taskId: ID, newStatus: Task['status']): void
}>()

const tasksStore = useTasksStore()
const showAdd = ref(false)
const newTitle = ref('')

// ref mutável que o VueDraggable pode escrever durante drag.
// watch nos props garante que mudanças no store (nova task, status mudado) sincronizam aqui.
const localTasks = ref<Task[]>([...props.tasks])
watch(() => props.tasks, (incoming) => { localTasks.value = [...incoming] })

function onAdd(event: { item: HTMLElement }) {
  const taskId = Number(event.item.dataset.taskId)
  if (taskId) emit('task-moved', taskId, props.status)
}

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  await tasksStore.add({
    title,
    projectId: props.projectId,
    status: props.status,
    priority: 'none',
    myDay: false,
  })
  newTitle.value = ''
  showAdd.value = false
}
</script>
