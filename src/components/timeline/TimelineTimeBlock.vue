<template>
  <div
    class="timeline-block absolute px-2 py-1 cursor-pointer select-none overflow-hidden group"
    :style="blockStyle"
    @mousedown.stop="startDrag"
    @click.stop="onClick"
  >
    <!-- Dashed border via pseudo-box-shadow / outline trick -->
    <div class="absolute inset-0 pointer-events-none"
      :style="{ border: `2px dashed ${block.color}`, opacity: 0.7 }" />

    <!-- Subtle diagonal texture to differentiate from tasks -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.06]"
      style="background-image: repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 6px)" />

    <div class="relative z-10">
      <div class="text-xs font-bold truncate leading-tight" :style="{ color: block.color }">
        {{ block.title || 'Block' }}
      </div>
      <div v-if="metrics.height > 32" class="text-[10px] font-tech opacity-60 truncate" :style="{ color: block.color }">
        {{ formatStart }} · {{ block.durationMin }}m
      </div>
    </div>

    <!-- Resize handle -->
    <div
      class="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
      @mousedown.stop="startResize"
    >
      <div class="w-8 h-0.5 rounded" :style="{ background: block.color }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format } from 'date-fns'
import type { TimeBlock } from '@/entities'
import {
  timeBlockToMetrics,
  clampTimelineTop,
  blockToDueAt,
  heightToEstimateMin,
  resolveColumnDateFromPointer,
  toDateKey,
} from '@/services/timelineScheduler'

const props = defineProps<{ block: TimeBlock; hourHeight: number }>()

const emit = defineEmits<{
  (e: 'commit', blockId: number, changes: Partial<TimeBlock>): void
  (e: 'edit', blockId: number, clientX: number, clientY: number): void
  (e: 'hover-date', dateKey: string | null): void
}>()

let suppressClickUntil = 0
const liveTop = ref<number | null>(null)
const liveHeight = ref<number | null>(null)
const dragging = ref(false)
const resizing = ref(false)

const metrics = computed(() => timeBlockToMetrics(props.block, props.hourHeight))
const effectiveTop = computed(() => liveTop.value ?? metrics.value.top)
const effectiveHeight = computed(() => liveHeight.value ?? metrics.value.height)

const formatStart = computed(() => format(new Date(props.block.startAt), 'HH:mm'))

const blockStyle = computed(() => ({
  top: `${effectiveTop.value}px`,
  height: `${effectiveHeight.value}px`,
  background: props.block.color + '18',
  left: '4px',
  right: '4px',
  zIndex: dragging.value || resizing.value ? 30 : 10,
}))

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.cursor-s-resize')) return
  const startY = e.clientY
  const startX = e.clientX
  const startTop = effectiveTop.value
  let moved = false
  let latestStartAt: Date | null = null
  dragging.value = true

  function onMove(me: MouseEvent) {
    if (!moved && (Math.abs(me.clientY - startY) > 3 || Math.abs(me.clientX - startX) > 3)) moved = true
    const newTop = clampTimelineTop(startTop + me.clientY - startY)
    liveTop.value = newTop
    const targetDate = resolveColumnDateFromPointer(me.clientX, me.clientY, getDateKeyFromPointer)
      ?? new Date(props.block.startAt)
    emit('hover-date', toDateKey(targetDate))
    latestStartAt = blockToDueAt(newTop, targetDate, props.hourHeight)
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    dragging.value = false
    emit('hover-date', null)
    liveTop.value = null
    if (moved) suppressClickUntil = Date.now() + 250
    if (moved && latestStartAt) emit('commit', props.block.id!, { startAt: latestStartAt })
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function startResize(e: MouseEvent) {
  const startY = e.clientY
  const startH = effectiveHeight.value
  let resized = false
  let latestDuration: number | null = null
  resizing.value = true

  function onMove(me: MouseEvent) {
    if (!resized && Math.abs(me.clientY - startY) > 2) resized = true
    const newH = Math.max(props.hourHeight / 4, startH + me.clientY - startY)
    liveHeight.value = newH
    latestDuration = heightToEstimateMin(newH, props.hourHeight)
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    resizing.value = false
    liveHeight.value = null
    if (resized) suppressClickUntil = Date.now() + 250
    if (resized && latestDuration !== null) emit('commit', props.block.id!, { durationMin: latestDuration })
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onClick(e: MouseEvent) {
  if (Date.now() < suppressClickUntil) return
  emit('edit', props.block.id!, e.clientX, e.clientY)
}

function getDateKeyFromPointer(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY)?.closest('[data-timeline-date]') as HTMLElement | null
  return el?.dataset.timelineDate ?? null
}
</script>
