<template>
  <span class="inline-flex items-center text-[9px] font-tech font-bold uppercase tracking-[0.2em] px-2 py-1 border-2 border-ink" :class="classes[status]">
    {{ labels[status].toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
import type { Task } from '@/entities'
defineProps<{ status: Task['status'] }>()

const labels: Record<Task['status'], string> = {
  todo: 'Pending', in_progress: 'In Progress', done: 'Completed', archived: 'Archived',
}
const classes: Record<Task['status'], string> = {
  todo: 'bg-white text-ink',
  in_progress: 'bg-tertiary text-white',
  done: 'bg-primary text-white',
  archived: 'bg-parchment-high text-ink/40',
}
</script>
