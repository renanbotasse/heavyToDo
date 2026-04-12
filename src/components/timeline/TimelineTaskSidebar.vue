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

      <!-- Block Types section -->
      <div class="flex flex-col mt-2">
        <div class="px-4 py-3 border-t-2 border-ink/20 border-b-2 border-ink/20 bg-ink/20 flex items-center justify-between">
          <span class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] font-tech">Block Types</span>
          <button
            class="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors text-sm leading-none"
            @click="startCreating"
          >＋</button>
        </div>

        <!-- New type form -->
        <div v-if="creating" class="px-3 py-3 flex flex-col gap-2 border-b-2 border-ink/20">
          <input
            ref="newNameRef"
            v-model="newName"
            placeholder="Type name…"
            class="w-full bg-transparent text-xs font-bold text-white outline-none border-b-2 border-white/30 pb-1 focus:border-white/70 transition-colors"
            @keydown.enter.prevent="confirmCreate"
            @keydown.escape.prevent="creating = false"
          />
          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="c in COLORS" :key="c"
              class="w-5 h-5 transition-transform hover:scale-110 border-2"
              :class="newColor === c ? 'border-white scale-110' : 'border-transparent'"
              :style="{ background: c }"
              @click="newColor = c"
            />
          </div>
          <div class="flex gap-2 justify-end">
            <button class="text-[9px] font-tech uppercase tracking-widest text-white/40 hover:text-white px-2 py-1" @click="creating = false">Cancel</button>
            <button class="text-[9px] font-tech uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-2 py-1 transition-colors" @click="confirmCreate">Add</button>
          </div>
        </div>

        <!-- Type list -->
        <div class="flex flex-col gap-0.5 px-2 py-2">
          <div v-if="typesStore.types.length === 0 && !creating"
            class="px-3 py-4 text-center text-[9px] font-tech uppercase tracking-widest text-white/25">
            No types yet — click ＋ to add
          </div>

          <div
            v-for="type in typesStore.types"
            :key="type.id"
            draggable="true"
            @dragstart="onTypeDragStart($event, type)"
            @dragend="draggingTypeId = null"
            class="group flex items-center gap-2 px-3 py-2.5 border-2 border-transparent hover:border-white/20 cursor-grab active:cursor-grabbing transition-all select-none"
            :class="draggingTypeId === type.id ? 'opacity-20' : ''"
          >
            <!-- Color swatch -->
            <span class="w-3 h-3 flex-shrink-0 border border-black/20" :style="{ background: type.color }" />

            <!-- Name — click to edit inline -->
            <div v-if="editingId !== type.id" class="flex-1 min-w-0" @click="startEditing(type)">
              <div class="text-xs font-bold text-white/80 truncate font-tech uppercase tracking-wider leading-none">{{ type.name }}</div>
              <div class="text-[8px] text-white/25 font-tech mt-0.5">Drag to timeline</div>
            </div>

            <!-- Inline edit form -->
            <div v-else class="flex-1 min-w-0 flex flex-col gap-1.5" @click.stop>
              <input
                ref="editNameRef"
                v-model="editName"
                class="w-full bg-transparent text-xs font-bold text-white outline-none border-b-2 border-white/40 pb-0.5"
                @keydown.enter.prevent="confirmEdit(type.id!)"
                @keydown.escape.prevent="editingId = null"
              />
              <div class="flex gap-1 flex-wrap">
                <button
                  v-for="c in COLORS" :key="c"
                  class="w-4 h-4 transition-transform hover:scale-110 border"
                  :class="editColor === c ? 'border-white scale-110' : 'border-transparent'"
                  :style="{ background: c }"
                  @click="editColor = c"
                />
              </div>
              <div class="flex gap-1 justify-end">
                <button class="text-[8px] font-tech uppercase text-white/40 hover:text-white px-1" @click="editingId = null">Cancel</button>
                <button class="text-[8px] font-tech uppercase text-white/70 hover:text-white px-1" @click="confirmEdit(type.id!)">Save</button>
              </div>
            </div>

            <!-- Delete -->
            <button
              class="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-xs transition-all flex-shrink-0 px-1"
              @click.stop="typesStore.remove(type.id!)"
            >✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { format } from 'date-fns'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useTimeBlockTypesStore } from '@/stores/timeBlockTypes'
import { Badge } from '@/components/ui/badge'
import type { Task, TimeBlockType } from '@/entities'

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const typesStore = useTimeBlockTypesStore()

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

// ── Task drag ──────────────────────────────────────────────
const draggingId = ref<number | null>(null)

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
  return projectsStore.projects
    .map(project => ({
      projectId: project.id!,
      name: project.name,
      color: project.color,
      tasks: map.get(project.id!) ?? [],
    }))
    .filter(g => g.tasks.length > 0)
})

const openProjects = ref<Set<number>>(new Set())
function isOpen(projectId: number) { return openProjects.value.has(projectId) }
function toggle(projectId: number) {
  if (openProjects.value.has(projectId)) openProjects.value.delete(projectId)
  else openProjects.value.add(projectId)
}

function formatDueAt(dueAt: Date) {
  return format(new Date(dueAt), 'MMM d, HH:mm')
}

function onDragStart(e: DragEvent, task: Task) {
  draggingId.value = task.id!
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('application/task-id', String(task.id))
}

function onDragEnd() { draggingId.value = null }

// ── Block type drag ────────────────────────────────────────
const draggingTypeId = ref<number | null>(null)

function onTypeDragStart(e: DragEvent, type: TimeBlockType) {
  draggingTypeId.value = type.id!
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('application/timeblock-type', JSON.stringify({ title: type.name, color: type.color }))
}

// ── Create new type ────────────────────────────────────────
const creating = ref(false)
const newName = ref('')
const newColor = ref(COLORS[5]) // blue default
const newNameRef = ref<HTMLInputElement | null>(null)

function startCreating() {
  creating.value = true
  newName.value = ''
  newColor.value = COLORS[5]
  nextTick(() => newNameRef.value?.focus())
}

async function confirmCreate() {
  const name = newName.value.trim()
  if (!name) return
  await typesStore.add({ name, color: newColor.value })
  creating.value = false
}

// ── Edit existing type ─────────────────────────────────────
const editingId = ref<number | null>(null)
const editName = ref('')
const editColor = ref('')
const editNameRef = ref<HTMLInputElement | null>(null)

function startEditing(type: TimeBlockType) {
  editingId.value = type.id!
  editName.value = type.name
  editColor.value = type.color
  nextTick(() => editNameRef.value?.focus())
}

async function confirmEdit(id: number) {
  const name = editName.value.trim()
  if (!name) return
  await typesStore.update(id, { name, color: editColor.value })
  editingId.value = null
}
</script>
