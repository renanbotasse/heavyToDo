<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center gap-4 px-6 py-4 border-b-3 border-ink flex-shrink-0 bg-parchment-container relative">
      <div class="flex border-2 border-ink bg-white shadow-[2px_2px_0_0_#0D0D0D]">
        <button v-for="v in views" :key="v.value" @click="view = v.value"
          class="px-4 py-1.5 text-[10px] font-tech font-bold uppercase tracking-wider transition-all border-r-2 border-ink last:border-r-0"
          :class="view === v.value ? 'bg-primary text-white' : 'text-ink hover:bg-parchment-high'">
          {{ v.label }}
        </button>
      </div>
      
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="sm" @click="navigate(-1)" class="p-0 h-8 w-8 text-xl">‹</Button>
        <span class="text-xs font-tech font-bold text-ink uppercase tracking-widest min-w-[180px] text-center">{{ dateLabel }}</span>
        <Button variant="ghost" size="sm" @click="navigate(1)" class="p-0 h-8 w-8 text-xl">›</Button>
      </div>

      <div class="flex-1" />

      <Button variant="default" @click="currentDate = new Date()" class="h-9 px-4 text-[10px] font-tech tracking-[0.2em]">
        RESET TO PRESENT
      </Button>
      <div class="absolute -bottom-[6px] left-0 w-full h-[3px] bg-ink opacity-10"></div>
    </div>

    <!-- Daily / Weekly -->
    <div v-if="view !== 'monthly'" class="flex flex-col flex-1 overflow-hidden bg-background">
      <!-- Weekly day headers -->
      <div v-if="view === 'weekly'" class="flex flex-shrink-0 border-b-2 border-ink bg-parchment-high">
        <div class="w-16 flex-shrink-0 bg-ink" />
        <div v-for="col in columns" :key="col.date.toISOString()"
          class="flex-1 h-10 flex flex-col items-center justify-center text-[10px] font-tech font-bold uppercase border-l-2 border-ink/20"
          :class="isSameDay(col.date, new Date()) ? 'bg-primary/10 text-primary' : 'text-ink/60'">
          <span>{{ col.date.toLocaleDateString('en-US', { weekday: 'short' }) }}</span>
          <span class="text-xs">{{ col.date.getDate() }}</span>
        </div>
      </div>

      <!-- Early-hours indicator -->
      <div v-if="earlyTaskCount > 0"
        class="flex-shrink-0 flex items-center gap-2 px-5 py-1.5 bg-amber-50 border-b-2 border-amber-300 cursor-pointer hover:bg-amber-100 transition-colors select-none"
        @click="scrollRef?.scrollTo({ top: 0, behavior: 'smooth' })">
        <span class="text-amber-600 text-xs leading-none">⚠</span>
        <span class="text-[10px] font-bold font-tech uppercase tracking-widest text-amber-700">
          {{ earlyTaskCount }} {{ earlyTaskCount === 1 ? 'task' : 'tasks' }} before 08:00 — click to view
        </span>
      </div>

      <!-- Scroll container -->
      <div class="flex flex-1 overflow-y-auto bg-parchment/10 relative" ref="scrollRef">
        <!-- Texture overlay -->
        <div class="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style="background-image: repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px);">
        </div>

        <div class="flex flex-shrink-0 z-10" :style="{ height: totalHeight + 'px', width: '100%' }">
          <!-- Hour labels -->
          <div class="w-16 flex-shrink-0 relative border-r-2 border-ink bg-ink text-white">
            <div v-for="h in hours" :key="h"
              class="absolute text-[10px] font-tech font-bold text-center flex items-center justify-center"
              :style="{ top: h * HOUR_H + 'px', height: HOUR_H + 'px', width: '100%' }">
              {{ String(h).padStart(2, '0') }}:00
            </div>
          </div>

          <!-- Day columns -->
          <div v-for="col in columns" :key="col.date.toISOString()"
            class="flex-1 relative border-l-2 border-ink/10"
            :data-timeline-date="toDateKey(col.date)"
            :class="dragOverDateKey === toDateKey(col.date) ? 'bg-primary/10' : ''"
            @dragover.prevent
            @dragenter.prevent="dragOverDateKey = toDateKey(col.date)"
            @dragleave="onDragLeaveColumn($event, col.date)"
            @drop="onDrop($event, col.date)"
            @mousedown="onMouseDown($event, col.date)">
            <!-- Hour lines -->
            <div v-for="h in hours" :key="h"
              class="absolute left-0 right-0 border-t-2 border-ink/5"
              :style="{ top: h * HOUR_H + 'px' }" />
            
            <!-- Now indicator -->
            <div v-if="nowTop >= 0 && isSameDay(col.date, new Date())"
              class="absolute left-0 right-0 flex items-center pointer-events-none z-20"
              :style="{ top: nowTop + 'px' }">
              <div class="w-2 h-2 bg-primary shadow-[1px_1px_0_0_#0D0D0D] -ml-1 flex-shrink-0" />
              <div class="flex-1 border-t-2 border-primary" />
            </div>

            <!-- Task blocks -->
            <TimelineBlock v-for="task in getTasksForDate(col.date)" :key="task.id"
              :task="task" :hour-height="HOUR_H" @commit="onTaskBlockCommit" @hover-date="onBlockHoverDate" />

            <!-- Time blocks -->
            <TimelineTimeBlock v-for="block in getTimeBlocksForDate(col.date)" :key="`tb-${block.id}`"
              :block="block" :hour-height="HOUR_H"
              @commit="onTimeBlockCommit"
              @edit="openEditPopover"
              @hover-date="onBlockHoverDate" />

            <!-- Ghost block -->
            <div v-if="ghost && isSameDay(ghost.date, col.date)"
              class="absolute left-2 right-2 bg-primary/20 border-2 border-primary border-dashed pointer-events-none"
              :style="{ top: ghost.top + 'px', height: ghost.height + 'px' }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly -->
    <div v-else class="flex-1 overflow-auto p-8 bg-background">
      <div class="grid grid-cols-7 border-3 border-ink">
        <div v-for="d in ['SUN','MON','TUE','WED','THU','FRI','SAT']" :key="d"
          class="bg-ink text-white text-[10px] font-tech font-bold py-3 text-center border-r border-white/20 last:border-r-0">{{ d }}</div>

        <div v-for="cell in monthCells" :key="cell.date.toISOString()"
          class="min-h-[120px] border-t-3 border-r-3 border-ink p-3 cursor-pointer transition-all bg-parchment/5 hover:bg-parchment-high relative group"
          :class="{ 'bg-background': cell.currentMonth, 'opacity-40': !cell.currentMonth }"
          @click="currentDate = cell.date; view = 'daily'">

          <div class="text-sm font-tech font-bold mb-2"
            :class="isSameDay(cell.date, new Date()) ? 'bg-primary text-white px-1 w-fit' : 'text-ink'">
            {{ cell.date.getDate() }}
          </div>

          <div class="flex flex-col gap-1">
            <div v-for="task in getTasksForDate(cell.date).slice(0, 3)" :key="task.id"
              class="text-[9px] font-tech font-bold uppercase tracking-tighter truncate border-l-2 px-1.5 py-0.5"
              :style="{ borderColor: getTaskColor(task) }">
              {{ task.title }}
            </div>
            <div v-if="getTasksForDate(cell.date).length > 3" class="text-[8px] font-tech font-bold opacity-30 mt-1">
              +{{ getTasksForDate(cell.date).length - 3 }} UNITS
            </div>
          </div>

          <div class="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 pointer-events-none" />
        </div>
      </div>
    </div>

    <!-- Time Block Popover -->
    <TimeBlockPopover
      v-if="pendingBlock"
      :mode="pendingBlock.mode"
      :title="pendingBlock.title"
      :color="pendingBlock.color"
      :duration-min="pendingBlock.durationMin"
      :x="pendingBlock.x"
      :y="pendingBlock.y"
      @confirm="confirmPopover"
      @cancel="pendingBlock = null"
      @delete="deleteBlock"
      @duplicate="duplicateBlock"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import { useTimeBlocksStore } from '@/stores/timeBlocks'
import { Button } from '@/components/ui/button'
import TimelineBlock from './TimelineBlock.vue'
import TimelineTimeBlock from './TimelineTimeBlock.vue'
import TimeBlockPopover from './TimeBlockPopover.vue'
import type { Task, TimeBlock } from '@/entities'
import { blockToDueAt, heightToEstimateMin, toDateKey } from '@/services/timelineScheduler'

const scrollRef = ref<HTMLElement | null>(null)
const HOUR_H = 64
const VISIBLE_START_HOUR = 8
const hours = Array.from({ length: 24 }, (_, i) => i)
const totalHeight = 24 * HOUR_H

type View = 'daily' | 'weekly' | 'monthly'
const view = ref<View>('daily')
const currentDate = ref(new Date())
const views = [{ value: 'daily' as View, label: 'Day' }, { value: 'weekly' as View, label: 'Week' }, { value: 'monthly' as View, label: 'Month' }]

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const timeBlocksStore = useTimeBlocksStore()
const dragOverDateKey = ref<string | null>(null)

type PendingBlock = {
  mode: 'create' | 'edit'
  blockId?: number
  startAt: Date
  x: number
  y: number
  title: string
  color: string
  durationMin: number
}
const pendingBlock = ref<PendingBlock | null>(null)

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getWeekStart(d: Date) {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

function getWeekDays() {
  const s = getWeekStart(currentDate.value)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return d })
}

const columns = computed(() => {
  if (view.value === 'daily') return [{ date: currentDate.value }]
  return getWeekDays().map(d => ({ date: d }))
})

const dateLabel = computed(() => {
  if (view.value === 'daily') return format(currentDate.value, 'EEEE, MMMM d, yyyy')
  if (view.value === 'weekly') {
    const days = getWeekDays()
    return `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`
  }
  return format(currentDate.value, 'MMMM yyyy')
})

function navigate(d: number) {
  const nd = new Date(currentDate.value)
  if (view.value === 'daily') nd.setDate(nd.getDate() + d)
  else if (view.value === 'weekly') nd.setDate(nd.getDate() + d * 7)
  else nd.setMonth(nd.getMonth() + d)
  currentDate.value = nd
}

const nowTop = ref(-1)
function updateNow() { const n = new Date(); nowTop.value = n.getHours() * HOUR_H + (n.getMinutes() / 60) * HOUR_H }
let nowTimer: ReturnType<typeof setInterval>
onMounted(() => {
  updateNow()
  nowTimer = setInterval(updateNow, 60000)
  // Start grid at VISIBLE_START_HOUR; if current time is past that, start 1h before now
  const hour = new Date().getHours()
  const targetHour = hour >= VISIBLE_START_HOUR ? Math.max(VISIBLE_START_HOUR, hour - 1) : VISIBLE_START_HOUR
  scrollRef.value?.scrollTo({ top: targetHour * HOUR_H })
})
onBeforeUnmount(() => clearInterval(nowTimer))

const scheduledTasks = computed(() =>
  tasksStore.tasks.filter(t => !!t.dueAt)
)

function getTasksForDate(date: Date) {
  return scheduledTasks.value.filter(t => isSameDay(new Date(t.dueAt!), date))
}

function getTimeBlocksForDate(date: Date) {
  return timeBlocksStore.blocks.filter(b => isSameDay(new Date(b.startAt), date))
}

// Count tasks across visible columns that are before VISIBLE_START_HOUR
const earlyTaskCount = computed(() => {
  if (view.value === 'monthly') return 0
  return columns.value.reduce((acc, col) => {
    return acc + getTasksForDate(col.date).filter(t => new Date(t.dueAt!).getHours() < VISIBLE_START_HOUR).length
  }, 0)
})

function openCreatePopover(startAt: Date, x: number, y: number) {
  pendingBlock.value = { mode: 'create', startAt, x, y, title: '', color: '#3b82f6', durationMin: 60 }
}

function openEditPopover(blockId: number, x: number, y: number) {
  const block = timeBlocksStore.blocks.find(b => b.id === blockId)
  if (!block) return
  pendingBlock.value = {
    mode: 'edit',
    blockId,
    startAt: new Date(block.startAt),
    x, y,
    title: block.title,
    color: block.color,
    durationMin: block.durationMin,
  }
}

async function confirmPopover(title: string, color: string, durationMin: number) {
  if (!pendingBlock.value) return
  if (pendingBlock.value.mode === 'create') {
    await timeBlocksStore.add({ title, color, startAt: pendingBlock.value.startAt, durationMin })
  } else if (pendingBlock.value.blockId !== undefined) {
    await timeBlocksStore.update(pendingBlock.value.blockId, { title, color, durationMin })
  }
  pendingBlock.value = null
}

async function deleteBlock() {
  if (pendingBlock.value?.blockId !== undefined) {
    await timeBlocksStore.remove(pendingBlock.value.blockId)
  }
  pendingBlock.value = null
}

async function duplicateBlock() {
  if (!pendingBlock.value || pendingBlock.value.blockId === undefined) return
  const src = timeBlocksStore.blocks.find(b => b.id === pendingBlock.value!.blockId)
  if (!src) return
  const startAt = new Date(new Date(src.startAt).getTime() + src.durationMin * 60_000)
  await timeBlocksStore.add({ title: src.title, color: src.color, startAt, durationMin: src.durationMin })
  pendingBlock.value = null
}

function getTaskColor(task: Task) {
  return projectsStore.getById(task.projectId)?.color ?? '#6366f1'
}

const monthCells = computed(() => {
  const y = currentDate.value.getFullYear(), mo = currentDate.value.getMonth()
  const offset = new Date(y, mo, 1).getDay()
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(y, mo, 1 - offset + i)
    return { date: d, currentMonth: d.getMonth() === mo }
  })
})

// Drop from sidebar / other
async function onDrop(e: DragEvent, date: Date) {
  dragOverDateKey.value = null
  // rect.top already reflects current scroll (element moves up as you scroll),
  // so no need to add scrollTop — that would double-count it.
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const relY = e.clientY - rect.top

  // Block type drop — create directly with type's title/color and 1h default
  const typeData = e.dataTransfer?.getData('application/timeblock-type')
  if (typeData) {
    const { title, color } = JSON.parse(typeData) as { title: string; color: string }
    const startAt = blockToDueAt(relY, date, HOUR_H)
    await timeBlocksStore.add({ title, color, startAt, durationMin: 60 })
    return
  }

  // Existing task drop
  const taskId = Number(e.dataTransfer?.getData('application/task-id'))
  if (!taskId) return
  ;(e.currentTarget as HTMLElement).addEventListener(
    'click',
    (ev) => ev.stopPropagation(),
    { once: true, capture: true }
  )
  const dueAt = blockToDueAt(relY, date, HOUR_H)
  await tasksStore.update(taskId, { dueAt })
}

async function onTaskBlockCommit(taskId: number, changes: Partial<Task>) {
  await tasksStore.update(taskId, changes)
}

async function onTimeBlockCommit(blockId: number, changes: Partial<TimeBlock>) {
  await timeBlocksStore.update(blockId, changes)
}

function onBlockHoverDate(dateKey: string | null) {
  dragOverDateKey.value = dateKey
}

function onDragLeaveColumn(e: DragEvent, date: Date) {
  const col = e.currentTarget as HTMLElement
  const related = e.relatedTarget as Node | null
  if (related && col.contains(related)) return
  if (dragOverDateKey.value === toDateKey(date)) dragOverDateKey.value = null
}

// Ghost block for draw-to-create
const ghost = ref<{ top: number; height: number; date: Date } | null>(null)
let dragStartY = 0

function onMouseDown(e: MouseEvent, date: Date) {
  if ((e.target as HTMLElement).closest('.timeline-block')) return
  // Anchor to the scroll container (fixed viewport rect) + live scrollTop
  // so the calculation stays correct if the user scrolls during the draw gesture.
  const container = scrollRef.value!
  const containerRect = container.getBoundingClientRect()
  dragStartY = e.clientY - containerRect.top + container.scrollTop
  ghost.value = { top: dragStartY, height: 0, date }

  function onMove(me: MouseEvent) {
    const y = me.clientY - containerRect.top + (scrollRef.value?.scrollTop ?? 0)
    const top = Math.min(dragStartY, y)
    const height = Math.abs(y - dragStartY)
    ghost.value = { top, height: Math.max(height, HOUR_H / 4), date }
  }

  async function onUp(_me: MouseEvent) {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    if (!ghost.value || ghost.value.height < HOUR_H / 4) { ghost.value = null; return }
    const { top, height } = ghost.value
    ghost.value = null
    const dueAt = blockToDueAt(top, date, HOUR_H)
    const timeEstimateMin = heightToEstimateMin(height, HOUR_H)
    await tasksStore.add({ title: 'New task', status: 'todo', priority: 'none', myDay: false, dueAt, timeEstimateMin })
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

</script>
