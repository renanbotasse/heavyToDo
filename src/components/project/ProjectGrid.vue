<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-foreground">Projects</h2>
      <button @click="showAdd = !showAdd"
        class="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
        + New Project
      </button>
    </div>

    <form v-if="showAdd" @submit.prevent="handleAdd"
      class="flex items-center gap-3 bg-card border border-border rounded-xl p-4 mb-4">
      <input v-model="newName" autofocus placeholder="Project name…"
        class="flex-1 bg-secondary text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring border border-border" />
      <input type="color" v-model="newColor" class="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
      <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Create</button>
      <button type="button" @click="showAdd = false" class="text-muted-foreground hover:text-foreground text-sm">Cancel</button>
    </form>

    <div class="grid grid-cols-3 gap-3">
      <RouterLink
        v-for="project in projectsStore.projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-border/80 transition-all hover:scale-[1.02]"
        :style="{ background: project.color + '22' }"
      >
        <!-- Contador no canto superior direito -->
        <div class="absolute top-2 right-2">
          <span v-if="getPendingCount(project.id!) > 0"
            class="text-xs font-semibold text-white bg-black/40 rounded-full px-2 py-0.5 backdrop-blur-sm">
            {{ getPendingCount(project.id!) }}
          </span>
        </div>

        <!-- Cor sólida na borda esquerda -->
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" :style="{ background: project.color }" />

        <div class="absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="text-sm font-semibold text-foreground truncate">{{ project.name }}</h3>
          <p class="text-xs text-muted-foreground mt-0.5">{{ getTotalCount(project.id!) }} tasks</p>
        </div>

        <!-- Delete (não-default) -->
        <button
          v-if="!project.isDefault"
          @click.prevent="projectsStore.remove(project.id!)"
          class="absolute top-2 left-2 w-5 h-5 bg-destructive/80 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >✕</button>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'

const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const showAdd = ref(false)
const newName = ref('')
const newColor = ref('#6366f1')

function getPendingCount(id: number) {
  return tasksStore.getByProject(id).filter(t => t.status !== 'done' && t.status !== 'archived').length
}

function getTotalCount(id: number) {
  return tasksStore.getByProject(id).length
}

async function handleAdd() {
  const name = newName.value.trim()
  if (!name) return
  await projectsStore.add(name, newColor.value)
  newName.value = ''
  showAdd.value = false
}
</script>
