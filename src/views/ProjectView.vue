<template>
  <ProjectViewComponent :project-id="Number(route.params.id)" class="h-full" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import ProjectViewComponent from '@/components/project/ProjectView.vue'
const route = useRoute()
</script>
