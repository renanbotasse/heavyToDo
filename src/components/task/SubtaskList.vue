<template>
  <div class="flex flex-col gap-4">
    <ProgressBar v-if="subtasks.length" :done="doneTasks" :total="subtasks.length" class="mb-4" />

    <div class="flex flex-col border-3 border-ink bg-white divide-y-2 divide-ink/10">
      <div
        v-for="sub in subtasks" :key="sub.id"
        class="group flex items-center gap-4 px-4 py-3 hover:bg-parchment-high cursor-pointer transition-colors"
        @click="uiStore.openTask(sub.id!)"
      >
        <button
          class="w-5 h-5 border-2 border-ink flex-shrink-0 flex items-center justify-center transition-all bg-white"
          :class="sub.status === 'done' ? 'bg-primary' : 'hover:bg-primary/10'"
          @click.stop="toggleSub(sub)"
        >
          <span v-if="sub.status === 'done'" class="text-white text-[10px] font-bold">X</span>
        </button>
        <span class="flex-1 text-sm font-bold text-ink truncate font-sans"
          :class="{ 'line-through text-ink/30': sub.status === 'done' }">
          {{ sub.title }}
        </span>
        <span v-if="sub.priority !== 'none'" class="w-2 h-2 flex-shrink-0 opacity-0 group-hover:opacity-100"
          :class="priorityColor[sub.priority]" />
      </div>
    </div>

    <form v-if="showAdd" @submit.prevent="handleAdd" class="flex flex-col gap-3 p-4 border-3 border-ink border-dashed mt-4 bg-parchment/5">
      <div class="flex flex-col gap-1">
        <label class="text-[9px] font-bold font-tech uppercase tracking-widest text-ink/50">New Operational Unit</label>
        <input v-model="newTitle" autofocus placeholder="COMMAND LINE INPUT..."
          class="w-full bg-transparent text-ink text-sm outline-none border-b-2 border-ink pb-1" />
      </div>
      <div class="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" @click="showAdd = false">DISCARD</Button>
        <Button type="submit" variant="default" size="sm">INITIATE</Button>
      </div>
    </form>

    <Button v-else @click="showAdd = true" variant="ghost"
      class="w-fit text-[10px] font-bold font-tech uppercase tracking-widest mt-2">
      + INITIALIZE SUB-UNIT
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useUIStore } from '@/stores/ui'
import ProgressBar from '@/components/shared/ProgressBar.vue'
import { Button } from '@/components/ui/button'
import type { Task } from '@/entities'

const props = defineProps<{ parentTask: Task }>()
const tasksStore = useTasksStore()
const uiStore = useUIStore()
const showAdd = ref(false)
const newTitle = ref('')

const subtasks = computed(() => tasksStore.getSubtasks(props.parentTask.id!))
const doneTasks = computed(() => subtasks.value.filter(s => s.status === 'done').length)
const priorityColor: Record<string, string> = { 
  low: 'bg-secondary', 
  medium: 'bg-tertiary', 
  high: 'bg-primary' 
}

async function toggleSub(sub: Task) {
  if (sub.status === 'done') await tasksStore.update(sub.id!, { status: 'todo', completedAt: undefined })
  else await tasksStore.complete(sub.id!)
}

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  await tasksStore.add({
    title,
    projectId: props.parentTask.projectId,
    parentId: props.parentTask.id,
    status: 'todo',
    priority: 'none',
    myDay: false,
  })
  newTitle.value = ''
  showAdd.value = false
}
</script>
