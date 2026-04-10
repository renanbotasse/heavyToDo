<template>
  <div class="flex flex-col h-full overflow-hidden" v-if="project">
    <div class="flex-shrink-0 mb-4">
      <input
        v-model="projectNameDraft"
        @blur="saveProjectName"
        @keydown.enter.prevent="saveProjectName"
        placeholder="Project name"
        class="w-full max-w-xl bg-white border-3 border-ink px-4 py-2.5 text-lg font-display italic font-bold text-ink outline-none focus:border-primary transition-colors"
      />
    </div>

    <!-- Secondary Navigation (Tabs) -->
    <div class="flex-shrink-0 mb-8">
      <div class="flex items-center gap-0 border-3 border-ink w-fit bg-parchment-container shadow-standard">
        <button
          v-for="tab in tabs" :key="tab"
          @click="activeTab = tab"
          class="px-6 py-2.5 text-xs font-tech font-bold uppercase tracking-widest transition-all border-r-3 border-ink last:border-r-0"
          :class="activeTab === tab
            ? 'bg-primary text-white'
            : 'bg-white text-ink hover:bg-parchment-high'"
        >{{ tab }}</button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-hidden relative">
      <div v-if="activeTab === 'Tasks'" class="h-full overflow-y-auto pr-4">
        <div class="flex items-center gap-2 mb-6 opacity-30">
          <span class="w-1.5 h-1.5 bg-ink"></span>
          <span class="text-[10px] font-bold font-tech uppercase tracking-[0.2em]">Deployment Sector: Tasks & Execution</span>
        </div>
        <TaskList :project-id="project.id!" />
      </div>
      <div v-else-if="activeTab === 'Kanban'" class="h-full overflow-hidden border-3 border-ink bg-white shadow-standard p-4">
        <KanbanView :project-id="project.id!" />
      </div>
      <div v-else-if="activeTab === 'Docs'" class="h-full overflow-hidden border-3 border-ink bg-white shadow-standard">
        <DocEditor :project-id="project.id!" />
      </div>
    </div>
  </div>
  <div v-else class="flex flex-col items-center justify-center h-full border-3 border-ink border-dashed">
    <span class="text-4xl mb-4 text-primary font-bold">404</span>
    <span class="text-xs font-tech font-bold uppercase tracking-[0.2em] opacity-40">Critical Error: Sector Not Found</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import TaskList from '@/components/task/TaskList.vue'
import KanbanView from '@/components/kanban/KanbanView.vue'
import DocEditor from '@/components/editor/DocEditor.vue'
import type { ID } from '@/entities'

const props = defineProps<{ projectId: ID }>()
const projectsStore = useProjectsStore()
const tabs = ['Tasks', 'Kanban', 'Docs'] as const
const activeTab = ref<typeof tabs[number]>('Tasks')
const project = computed(() => projectsStore.getById(props.projectId))
const projectNameDraft = ref('')

watch(project, (current) => {
  projectNameDraft.value = current?.name ?? ''
}, { immediate: true })

async function saveProjectName() {
  const current = project.value
  if (!current) return
  const trimmed = projectNameDraft.value.trim()
  if (!trimmed) {
    projectNameDraft.value = current.name
    return
  }
  if (trimmed === current.name) return
  await projectsStore.update(current.id!, { name: trimmed })
}
</script>
