<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl">
      <div class="flex items-center gap-2 mb-6 opacity-40">
        <span class="w-1.5 h-1.5 bg-ink"></span>
        <span class="text-[10px] font-bold font-tech uppercase tracking-[0.2em]">Storage Sector: Universal Inbox</span>
      </div>
      <TaskList :tasks="tasksStore.getInbox()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTasksStore } from '@/stores/tasks'
import TaskList from '@/components/task/TaskList.vue'
const tasksStore = useTasksStore()
</script>
