<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-40" @click="$emit('cancel')" />

  <!-- Popover -->
  <div
    class="fixed z-50 bg-white border-3 border-ink shadow-high-impact p-5 w-64 flex flex-col gap-4"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @click.stop
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="text-[10px] font-bold font-tech uppercase tracking-[0.2em] text-ink/50">
        {{ mode === 'create' ? 'New Time Block' : 'Edit Block' }}
      </span>
      <button class="text-ink/40 hover:text-primary text-sm" @click="$emit('cancel')">✕</button>
    </div>

    <!-- Title -->
    <div class="flex flex-col gap-1">
      <label class="text-[9px] font-bold font-tech uppercase tracking-widest text-ink/50">Title</label>
      <input
        ref="titleRef"
        v-model="localTitle"
        placeholder="Block title…"
        class="w-full bg-transparent text-sm font-bold text-ink outline-none border-b-2 border-ink/30 pb-1 focus:border-primary transition-colors"
        @keydown.enter.prevent="confirm"
        @keydown.escape.prevent="$emit('cancel')"
      />
    </div>

    <!-- Color palette -->
    <div class="flex flex-col gap-1.5">
      <label class="text-[9px] font-bold font-tech uppercase tracking-widest text-ink/50">Color</label>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="c in COLORS"
          :key="c"
          class="w-6 h-6 transition-transform hover:scale-110 border-2"
          :class="localColor === c ? 'border-ink scale-110' : 'border-transparent'"
          :style="{ background: c }"
          @click="localColor = c"
        />
      </div>
    </div>

    <!-- Duration -->
    <div class="flex flex-col gap-1.5">
      <label class="text-[9px] font-bold font-tech uppercase tracking-widest text-ink/50">Duration</label>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="d in DURATIONS"
          :key="d.value"
          class="px-2 py-1 text-[10px] font-tech font-bold border-2 transition-colors"
          :class="localDuration === d.value
            ? 'bg-ink text-white border-ink'
            : 'bg-white text-ink border-ink/30 hover:border-ink'"
          @click="localDuration = d.value"
        >{{ d.label }}</button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-2 border-t-2 border-ink/10 pt-3">
      <!-- Destructive / secondary row (edit only) -->
      <div v-if="mode === 'edit'" class="flex gap-2">
        <button
          class="flex-1 text-[10px] font-tech uppercase tracking-widest text-red-500 hover:text-red-700 border-2 border-red-200 hover:border-red-400 py-1.5 transition-colors"
          @click="$emit('delete')"
        >Delete</button>
        <button
          class="flex-1 text-[10px] font-tech uppercase tracking-widest text-ink/50 hover:text-ink border-2 border-ink/20 hover:border-ink py-1.5 transition-colors"
          @click="$emit('duplicate')"
        >Duplicate</button>
      </div>
      <!-- Primary row -->
      <div class="flex gap-2 justify-end">
        <button
          class="text-[10px] font-tech uppercase tracking-widest text-ink/50 hover:text-ink px-2 py-1"
          @click="$emit('cancel')"
        >Cancel</button>
        <button
          class="px-3 py-1.5 bg-ink text-white text-[10px] font-tech uppercase tracking-widest hover:bg-primary transition-colors"
          @click="confirm"
        >{{ mode === 'create' ? 'Create' : 'Save' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  mode: 'create' | 'edit'
  title: string
  color: string
  durationMin: number
  x: number
  y: number
}>()

const emit = defineEmits<{
  (e: 'confirm', title: string, color: string, durationMin: number): void
  (e: 'cancel'): void
  (e: 'delete'): void
  (e: 'duplicate'): void
}>()

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

const DURATIONS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '1h',  value: 60 },
  { label: '1h30', value: 90 },
  { label: '2h',  value: 120 },
  { label: '3h',  value: 180 },
  { label: '4h',  value: 240 },
]

const titleRef = ref<HTMLInputElement | null>(null)
const localTitle = ref(props.title)
const localColor = ref(props.color)
const localDuration = ref(props.durationMin)

// Adjust coordinates to stay within viewport
const pos = computed(() => {
  const w = 256, h = 320
  const x = props.x + w > window.innerWidth  ? props.x - w : props.x
  const y = props.y + h > window.innerHeight ? props.y - h : props.y
  return { x: Math.max(8, x), y: Math.max(8, y) }
})

onMounted(() => {
  titleRef.value?.focus()
  titleRef.value?.select()
})

function confirm() {
  emit('confirm', localTitle.value.trim() || 'Block', localColor.value, localDuration.value)
}
</script>
