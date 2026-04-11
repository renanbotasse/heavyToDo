<template>
  <div class="flex flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex items-center gap-4 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold font-tech uppercase tracking-widest text-ink/50">Filter Status</label>
        <select v-model="filterStatus"
          class="bg-parchment text-ink text-xs border-3 border-ink px-3 py-2 outline-none font-tech">
          <option value="">ALL RECORDS</option>
          <option value="todo">PENDING</option>
          <option value="in_progress">IN PROGRESS</option>
          <option value="done">COMPLETED</option>
        </select>
      </div>
      <span class="flex-1" />
      <Button @click="showAdd = true" variant="default" size="default">
        + NEW ENTRY
      </Button>
    </div>

    <!-- Quick add -->
    <form v-if="showAdd" @submit.prevent="handleAdd"
      class="flex flex-col gap-4 bg-white border-3 border-ink shadow-standard p-6 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold font-tech uppercase tracking-widest">Entry Title</label>
        <input v-model="newTitle" autofocus placeholder="Task title..."
          class="w-full bg-white text-ink text-lg outline-none border-b-3 border-black p-0" />
      </div>
      <div class="flex gap-2 justify-end">
        <Button type="button" variant="ghost" @click="showAdd = false">Cancel</Button>
        <Button type="submit" variant="default">Add</Button>
      </div>
    </form>

    <!-- Loading skeletons -->
    <template v-if="loading">
      <SkeletonCard v-for="n in 4" :key="n" />
    </template>

    <!-- Draggable task list (project view, no filter) -->
    <template v-else-if="isDraggable">
      <VueDraggable
        v-model="localTasks"
        handle=".task-drag-handle"
        :animation="150"
        class="flex flex-col gap-3"
        @end="onTaskReorder"
      >
        <TaskItem
          v-for="(task, i) in localTasks"
          :key="task.id"
          :task="task"
          :position="i + 1"
        />
      </VueDraggable>
      <div v-if="localTasks.length === 0"
        class="text-sm font-tech text-muted-foreground uppercase py-12 text-center border-3 border-ink border-dashed opacity-50">
        NO TASKS IN THIS PROJECT
      </div>
    </template>

    <!-- Static list (filtered or no projectId) -->
    <template v-else>
      <div class="flex flex-col gap-3">
        <TaskItem
          v-for="task in filtered"
          :key="task.id"
          :task="task"
          :position="getPositionLabel(task.id!)"
        />
      </div>
      <div v-if="filtered.length === 0"
        class="text-sm font-tech text-muted-foreground uppercase py-12 text-center border-3 border-ink border-dashed opacity-50">
        NO DATA FOUND IN THIS SECTOR
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import TaskItem from './TaskItem.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import type { Task, ID } from '@/entities'

const props = defineProps<{ projectId?: number; tasks?: Task[]; loading?: boolean }>()

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()

const showAdd = ref(false)
const newTitle = ref('')
const filterStatus = ref('')

const source = computed(() => {
  if (props.tasks) return props.tasks
  if (props.projectId !== undefined) return tasksStore.getByProject(props.projectId)
  return tasksStore.rootTasks
})

const filtered = computed(() => {
  let list = source.value.filter(t => !t.parentId)
  if (filterStatus.value) list = list.filter(t => t.status === filterStatus.value)
  return list
})

// Drag is only enabled in project view with no active filter
const isDraggable = computed(() => props.projectId !== undefined && !filterStatus.value)

// Local copy for drag; syncs from filtered when store or filter changes
const localTasks = ref<Task[]>([...filtered.value])
watch(filtered, incoming => { localTasks.value = [...incoming] })

function onTaskReorder() {
  if (!isDraggable.value) return
  tasksStore.reorderInProject(localTasks.value.map(t => t.id!))
}

// For the static (filtered) view, show the real position within the project
function getPositionLabel(taskId: ID): number | undefined {
  if (props.projectId === undefined) return undefined
  return tasksStore.getPositionInProject(taskId)
}

async function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  const def = projectsStore.getDefault()
  await tasksStore.add({
    title,
    projectId: props.projectId ?? def?.id,
    status: 'todo',
    priority: 'none',
    myDay: false,
  })
  newTitle.value = ''
  showAdd.value = false
}
</script>
