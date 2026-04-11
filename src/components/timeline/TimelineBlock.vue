<template>
  <div
    class="timeline-block absolute rounded-lg px-2 py-1 cursor-pointer select-none overflow-hidden group"
    :style="blockStyle"
    @mousedown.stop="startDrag"
    @click.stop="onClick"
  >
    <!-- done/archived strikethrough overlay -->
    <div v-if="isFinished" class="absolute inset-0 pointer-events-none"
      style="background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 8px)" />
    <div class="text-xs font-medium truncate text-white leading-tight"
      :class="{ 'line-through opacity-60': isFinished }">{{ task.title }}</div>
    <div v-if="blockHeight > 32" class="text-xs text-white/60 truncate">
      <span v-if="isFinished" class="mr-1">{{ task.status === 'done' ? '✓' : '▣' }}</span>
      {{ task.dueAt ? format(new Date(task.dueAt), 'HH:mm') : '' }}
    </div>
    <!-- Resize handle -->
    <div class="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
      @mousedown.stop="startResize">
      <div class="w-8 h-0.5 rounded bg-white/40" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format } from 'date-fns'
import { useProjectsStore } from '@/stores/projects'
import { useUIStore } from '@/stores/ui'
import type { Task } from '@/entities'
import {
  clampTimelineTop,
  blockToDueAt,
  heightToEstimateMin,
  resolveColumnDateFromPointer,
  taskToBlock,
  toDateKey,
} from '@/services/timelineScheduler'

const props = defineProps<{ task: Task; hourHeight: number }>()
const emit = defineEmits<{
  (e: 'commit', taskId: number, changes: Partial<Task>): void
  (e: 'hover-date', dateKey: string | null): void
}>()

const projectsStore = useProjectsStore()
const uiStore = useUIStore()
let suppressClickUntil = 0
const liveTop = ref<number | null>(null)
const liveHeight = ref<number | null>(null)
const dragging = ref(false)
const resizing = ref(false)

const color = computed(() => {
  if (!props.task.projectId) return '#6366f1'
  return projectsStore.getById(props.task.projectId)?.color ?? '#6366f1'
})

const blockTop = computed(() => taskToBlock(props.task, props.hourHeight).top)
const blockHeight = computed(() => taskToBlock(props.task, props.hourHeight).height)
const effectiveTop = computed(() => (liveTop.value ?? blockTop.value))
const effectiveHeight = computed(() => (liveHeight.value ?? blockHeight.value))

const isSubtask = computed(() => !!props.task.parentId)
const isFinished = computed(() => props.task.status === 'done' || props.task.status === 'archived')

const blockStyle = computed(() => ({
  top: `${effectiveTop.value}px`,
  height: `${effectiveHeight.value}px`,
  background: color.value + (isFinished.value ? '55' : isSubtask.value ? '88' : 'cc'),
  borderLeft: `${isSubtask.value ? '2px dashed' : '3px solid'} ${color.value}`,
  left: isSubtask.value ? '14px' : '4px',
  right: '4px',
  zIndex: dragging.value || resizing.value ? 30 : 10,
  opacity: isFinished.value ? '0.7' : '1',
}))

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.cursor-s-resize')) return
  const startY = e.clientY
  const startX = e.clientX
  const startTop = effectiveTop.value
  let moved = false
  let latestDueAt: Date | null = null
  dragging.value = true

  function onMove(me: MouseEvent) {
    if (!moved && (Math.abs(me.clientY - startY) > 3 || Math.abs(me.clientX - startX) > 3)) {
      moved = true
    }
    const newTop = clampTimelineTop(startTop + me.clientY - startY)
    liveTop.value = newTop
    const targetDate = resolveColumnDateFromPointer(me.clientX, me.clientY, getDateKeyFromPointer) ?? new Date(props.task.dueAt ?? new Date())
    emit('hover-date', toDateKey(targetDate))
    latestDueAt = blockToDueAt(newTop, targetDate, props.hourHeight)
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    dragging.value = false
    emit('hover-date', null)
    liveTop.value = null
    if (moved) suppressClickUntil = Date.now() + 250
    if (moved && latestDueAt) {
      emit('commit', props.task.id!, { dueAt: latestDueAt })
    }
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function startResize(e: MouseEvent) {
  const startY = e.clientY
  const startH = effectiveHeight.value
  let resized = false
  let latestEstimate: number | null = null
  resizing.value = true

  function onMove(me: MouseEvent) {
    if (!resized && Math.abs(me.clientY - startY) > 2) resized = true
    const newH = Math.max(props.hourHeight / 4, startH + me.clientY - startY)
    liveHeight.value = newH
    latestEstimate = heightToEstimateMin(newH, props.hourHeight)
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    resizing.value = false
    liveHeight.value = null
    if (resized) suppressClickUntil = Date.now() + 250
    if (resized && latestEstimate !== null) {
      emit('commit', props.task.id!, { timeEstimateMin: latestEstimate })
    }
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onClick() {
  if (Date.now() < suppressClickUntil) return
  uiStore.openTask(props.task.id!)
}

function getDateKeyFromPointer(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY)?.closest('[data-timeline-date]') as HTMLElement | null
  return el?.dataset.timelineDate ?? null
}
</script>
