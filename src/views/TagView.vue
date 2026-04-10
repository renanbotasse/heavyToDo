<template>
  <div class="px-6 py-6 h-full overflow-y-auto">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-2 mb-6">
        <span class="w-3 h-3 rounded-full" :style="{ background: tag?.color ?? '#6b7280' }" />
        <h1 class="text-2xl font-bold text-foreground">{{ tagName }}</h1>
      </div>
      <TaskList :tasks="tasks" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useTagsStore } from '@/stores/tags'
import TaskList from '@/components/task/TaskList.vue'

const route = useRoute()
const tasksStore = useTasksStore()
const tagsStore = useTagsStore()

const tagName = computed(() => decodeURIComponent(String(route.params.name)))
const tag = computed(() => tagsStore.tags.find(t => t.name === tagName.value))
const tasks = computed(() => tasksStore.rootTasks)
</script>
