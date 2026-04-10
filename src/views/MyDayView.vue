<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl">
      <div class="flex items-center gap-2 mb-6 opacity-40">
        <span class="w-1.5 h-1.5 bg-ink"></span>
        <span class="text-[10px] font-bold font-tech uppercase tracking-[0.2em]">Temporal Anchor: {{ today.toUpperCase() }}</span>
      </div>

      <!-- Sugestões -->
      <div v-if="suggestions.length" class="mb-12 relative">
        <div class="absolute -top-3 -left-2 bg-primary text-white px-2 py-0.5 text-[8px] font-bold font-tech uppercase z-10 shadow-[2px_2px_0_0_#0D0D0D]">Critical Intel: Pending Units</div>
        <div class="flex flex-col border-3 border-ink shadow-standard bg-white p-6 pt-10">
          <div v-for="task in suggestions" :key="task.id"
            class="flex items-center justify-between py-3 border-b-2 border-ink/10 last:border-b-0 group">
            <span class="text-sm font-bold text-ink truncate flex-1 font-sans">{{ task.title }}</span>
            <Button @click="tasksStore.toggleMyDay(task.id!)"
              variant="outline" size="sm" class="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              + ASSIGN TO DAY
            </Button>
          </div>
        </div>
      </div>

      <TaskList :tasks="tasksStore.getMyDay()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isToday, isPast } from 'date-fns'
import { useTasksStore } from '@/stores/tasks'
import TaskList from '@/components/task/TaskList.vue'
import { Button } from '@/components/ui/button'

const tasksStore = useTasksStore()

const today = computed(() => format(new Date(), 'EEEE, MMMM d'))

// Sugestões: tasks com dueAt hoje ou atrasadas, que não estão no myDay
const suggestions = computed(() =>
  tasksStore.rootTasks.filter(t => {
    if (t.myDay || t.status === 'done' || t.status === 'archived') return false
    if (!t.dueAt) return false
    const d = new Date(t.dueAt)
    return isToday(d) || isPast(d)
  }).slice(0, 5)
)
</script>
