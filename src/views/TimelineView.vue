<template>
  <div class="flex h-full overflow-hidden">
    <TimelineTaskSidebar />
    <TimelineGrid class="flex-1 min-w-0" />
  </div>
</template>

<script setup lang="ts">
import TimelineTaskSidebar from '@/components/timeline/TimelineTaskSidebar.vue'
import TimelineGrid from '@/components/timeline/TimelineGrid.vue'
</script>
