<template>
  <Dialog :open="!!uiStore.activeTaskId" @update:open="val => !val && uiStore.closeTask()">
    <DialogContent class="max-w-6xl sm:max-w-6xl w-[92vw] bg-parchment border-3 border-ink text-ink p-0 gap-0 overflow-hidden h-[88vh] shadow-high-impact">
      <template v-if="task">
        <!-- Header area -->
        <div class="flex items-start gap-4 px-10 py-7 border-b-3 border-ink bg-parchment-container relative flex-shrink-0">
          <input
            v-model="titleDraft"
            class="flex-1 bg-transparent text-3xl font-display italic font-bold text-ink outline-none placeholder:text-ink/30 leading-tight"
            placeholder="Task title..."
            @input="queueSave"
          />
          <DialogClose class="text-ink hover:text-primary transition-colors mt-1 flex-shrink-0">
            <span class="text-2xl">✕</span>
          </DialogClose>
        </div>

        <div class="flex overflow-hidden flex-1 min-h-0">
          <!-- Main workspace -->
          <div class="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-10 bg-white">
            <!-- Description -->
            <div class="flex flex-col gap-3">
              <label class="text-[10px] font-bold font-tech uppercase tracking-[0.2em] text-ink/50">Description</label>
              <div class="border-3 border-ink bg-parchment/5 pt-7 pb-4 px-5 min-h-[240px] relative">
                <div class="absolute top-0 left-0 bg-ink text-white px-2 py-0.5 text-[8px] font-tech uppercase">Editor</div>
                <TaskEditor :content="task.description" @update="onDescUpdate" />
              </div>
            </div>

            <Separator hatched />

            <!-- Subtasks -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-primary"></span>
                <label class="text-[10px] font-bold font-tech uppercase tracking-[0.2em]">Subtasks</label>
              </div>
              <SubtaskList :parent-task="task" />
            </div>

            <Separator hatched />

            <!-- Comments -->
            <div class="flex flex-col gap-4 pb-4">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-secondary"></span>
                <label class="text-[10px] font-bold font-tech uppercase tracking-[0.2em]">Comments</label>
              </div>
              <CommentList :task-id="task.id!" />
            </div>
          </div>

          <!-- Metadata Sidebar -->
          <div class="w-72 flex-shrink-0 border-l-3 border-ink bg-parchment-high overflow-y-auto px-7 py-8 flex flex-col gap-7">
            <!-- Actions -->
            <div class="flex flex-col gap-3">
              <Button
                @click="timerStore.toggle(task.id!)"
                variant="default"
                class="w-full h-11 text-sm font-tech tracking-wider"
              >
                <span class="mr-2">{{ isTimerActive ? '⏹' : '▶' }}</span>
                {{ isTimerActive ? timerStore.elapsedFormatted : 'Start Timer' }}
              </Button>
              <Button
                @click="tasksStore.toggleMyDay(task.id!)"
                variant="outline"
                class="w-full h-11 text-sm font-tech tracking-wider"
                :class="{ 'bg-tertiary text-white': task.myDay }"
              >
                <span class="mr-2">☀</span>
                MY DAY
              </Button>
            </div>

            <Separator class="bg-ink/10 h-[2px]" />

            <!-- Metadata fields -->
            <div class="flex flex-col gap-5">
              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-ink/50 uppercase tracking-widest font-tech">Project</span>
                <select v-model="projectDraft" @change="queueSave" class="bg-white border-2 border-ink px-3 py-2 font-tech text-[11px] outline-none w-full">
                  <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">{{ p.name.toUpperCase() }}</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-ink/50 uppercase tracking-widest font-tech">Status</span>
                <select v-model="statusDraft" @change="queueSave" class="bg-white border-2 border-ink px-3 py-2 font-tech text-[11px] outline-none w-full">
                  <option value="todo">PENDING</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="done">COMPLETED</option>
                  <option value="archived">ARCHIVED</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-ink/50 uppercase tracking-widest font-tech">Priority</span>
                <select v-model="priorityDraft" @change="queueSave" class="bg-white border-2 border-ink px-3 py-2 font-tech text-[11px] outline-none w-full">
                  <option value="none">NONE</option>
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-ink/50 uppercase tracking-widest font-tech">Due Date</span>
                <div class="flex flex-col gap-2">
                  <input type="date" v-model="dueDateDraft" @change="queueSave" class="bg-white border-2 border-ink px-3 py-2 font-tech text-[11px] outline-none w-full" />
                  <input type="time" v-model="dueTimeDraft" @change="queueSave" class="bg-white border-2 border-ink px-3 py-2 font-tech text-[11px] outline-none w-full" />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-ink/50 uppercase tracking-widest font-tech">Estimate (min)</span>
                <input type="number" v-model.number="estimateDraft" @input="queueSave" min="0" step="15" class="bg-white border-2 border-ink px-3 py-2 font-tech text-[11px] outline-none w-full" />
              </div>

              <div v-if="totalSpentMin > 0" class="text-[10px] font-tech text-ink/40 uppercase tracking-widest border-t-2 border-ink/10 pt-4 text-center italic">
                {{ totalSpentMin }} min tracked
              </div>
            </div>

            <!-- Audit Trail -->
            <div class="mt-auto pt-6 border-t-3 border-ink">
              <span class="text-[9px] font-bold text-ink/40 uppercase tracking-widest font-tech block">Created</span>
              <p class="text-[11px] font-tech font-bold mt-0.5">{{ formatDate(task.createdAt).toUpperCase() }}</p>
              <div v-if="task.completedAt" class="mt-3">
                <span class="text-[9px] font-bold text-primary/70 uppercase tracking-widest font-tech block">Completed</span>
                <p class="text-[11px] font-tech font-bold text-primary mt-0.5">{{ formatDate(task.completedAt).toUpperCase() }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { useUIStore } from '@/stores/ui'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useTimerStore } from '@/stores/timer'
import { AutosaveQueue } from '@/services/autosave'
import TaskEditor from '@/components/editor/TaskEditor.vue'
import SubtaskList from './SubtaskList.vue'
import CommentList from './CommentList.vue'
import { TimerService } from '@/services/timer'
import type { Task } from '@/entities'

const uiStore = useUIStore()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const timerStore = useTimerStore()

const autosave = new AutosaveQueue()

const titleDraft = ref('')
const projectDraft = ref<number>(0)
const statusDraft = ref<Task['status']>('todo')
const priorityDraft = ref<Task['priority']>('none')
const dueDateDraft = ref('')
const dueTimeDraft = ref('')
const estimateDraft = ref<number | undefined>()
const totalSpentMin = ref(0)

const task = computed(() => {
  const id = uiStore.activeTaskId
  return id ? tasksStore.tasks.find(t => t.id === id) ?? null : null
})

const isTimerActive = computed(() => timerStore.activeTaskId === task.value?.id)

watch(task, async (t) => {
  if (!t) return
  titleDraft.value = t.title
  projectDraft.value = t.projectId
  statusDraft.value = t.status
  priorityDraft.value = t.priority
  dueDateDraft.value = t.dueAt ? format(new Date(t.dueAt), 'yyyy-MM-dd') : ''
  dueTimeDraft.value = t.dueAt ? format(new Date(t.dueAt), 'HH:mm') : ''
  estimateDraft.value = t.timeEstimateMin
  totalSpentMin.value = await TimerService.getDurationMin(t.id!)
}, { immediate: true })

function queueSave() {
  autosave.schedule(() => save())
}

function onDescUpdate(json: string) {
  autosave.schedule(async () => { await tasksStore.update(task.value!.id!, { description: json }) })
}

async function save() {
  if (!task.value) return
  let dueAt: Date | undefined
  if (dueDateDraft.value) {
    const [y, m, d] = dueDateDraft.value.split('-').map(Number)
    const [h, min] = dueTimeDraft.value ? dueTimeDraft.value.split(':').map(Number) : [0, 0]
    dueAt = new Date(y, m - 1, d, h, min)
  }
  await tasksStore.update(task.value.id!, {
    title: titleDraft.value,
    projectId: projectDraft.value,
    status: statusDraft.value,
    priority: priorityDraft.value,
    dueAt,
    timeEstimateMin: estimateDraft.value,
  })
}

function formatDate(d: Date | undefined) {
  if (!d) return ''
  return format(new Date(d), 'MMM d, yyyy')
}

onUnmounted(() => autosave.flush())
</script>
