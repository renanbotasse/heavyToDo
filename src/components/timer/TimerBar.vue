<template>
  <Transition name="slide-down">
    <div
      v-if="timerStore.isRunning"
      class="flex items-center gap-3 px-4 py-2 timer-bar"
    >
      <span class="text-xs text-muted-foreground flex-shrink-0">Timer</span>
      <span class="text-sm font-medium text-foreground truncate flex-1">{{ activeTask?.title ?? '…' }}</span>
      <span class="font-mono text-sm font-semibold text-primary tabular-nums">{{ timerStore.elapsedFormatted }}</span>
      <button
        @click="timerStore.toggle(timerStore.activeTaskId!)"
        class="text-xs px-2.5 py-1 bg-destructive/20 text-destructive border border-destructive/40 rounded-lg hover:bg-destructive/30 transition-colors flex-shrink-0"
      >Stop</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useTasksStore } from '@/stores/tasks'

const timerStore = useTimerStore()
const tasksStore = useTasksStore()

const activeTask = computed(() =>
  timerStore.activeTaskId ? tasksStore.tasks.find(t => t.id === timerStore.activeTaskId) : null
)
</script>

<style scoped>
.timer-bar {
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  box-shadow: 0 0 20px hsl(var(--primary) / 0.15), 0 0 40px hsl(var(--primary) / 0.08);
}

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
