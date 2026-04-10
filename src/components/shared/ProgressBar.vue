<template>
  <div class="flex items-center gap-3">
    <div class="flex-1 h-2 bg-parchment-high border-2 border-ink relative overflow-hidden">
      <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${percent}%` }" />
    </div>
    <span class="text-[9px] font-tech font-bold text-ink/60 flex-shrink-0 tabular-nums uppercase tracking-widest">{{ done }}/{{ total }} UNIT</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ done: number; total: number }>()
const percent = computed(() => props.total === 0 ? 0 : Math.round((props.done / props.total) * 100))
</script>
