<template>
  <span class="inline-flex items-center gap-1.5 text-[9px] font-tech font-bold uppercase tracking-widest" :class="classes[priority]">
    <span class="w-1.5 h-1.5 flex-shrink-0" :class="marker[priority]" />
    {{ labels[priority] }}
  </span>
</template>

<script setup lang="ts">
import type { Task } from '@/entities'
defineProps<{ priority: Task['priority'] }>()

const labels: Record<Task['priority'], string> = { 
  none: 'Standard', 
  low: 'Low Priority', 
  medium: 'High Impact', 
  high: 'Life or Death' 
}
const classes: Record<Task['priority'], string> = {
  none: 'text-ink/40', 
  low: 'text-secondary', 
  medium: 'text-tertiary', 
  high: 'text-primary'
}
const marker: Record<Task['priority'], string> = {
  none: 'bg-ink/20', 
  low: 'bg-secondary', 
  medium: 'bg-tertiary', 
  high: 'bg-primary'
}
</script>
