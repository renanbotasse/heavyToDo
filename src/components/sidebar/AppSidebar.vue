<template>
  <nav class="flex flex-col h-full overflow-hidden bg-secondary text-secondary-foreground" :style="{ width: uiStore.sidebarWidth + 'px' }">
    <!-- Logo -->
    <div class="px-6 py-8 flex-shrink-0">
      <h1 class="text-2xl font-display italic font-bold text-white uppercase tracking-tighter">to-do</h1>
      <div class="h-1 w-12 bg-primary mt-1"></div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
      <!-- Navegação principal -->
      <RouterLink to="/my-day" custom v-slot="{ navigate, isActive }">
        <button @click="navigate"
          class="w-full flex items-center gap-3 px-4 py-3 text-sm font-tech transition-all text-left"
          :class="isActive ? 'bg-primary text-primary-foreground border-r-3 border-ink shadow-standard translate-x-1' : 'hover:bg-ink/20'">
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="6" y="6" width="4" height="4" fill="currentColor" />
            <path d="M8 1V4M8 12V15M1 8H4M12 8H15" stroke="currentColor" stroke-width="2" />
          </svg>
          <span class="uppercase tracking-widest">Day</span>
        </button>
      </RouterLink>

      <RouterLink to="/inbox" custom v-slot="{ navigate, isActive }">
        <button @click="navigate"
          class="w-full flex items-center gap-3 px-4 py-3 text-sm font-tech transition-all text-left"
          :class="isActive ? 'bg-primary text-primary-foreground border-r-3 border-ink shadow-standard translate-x-1' : 'hover:bg-ink/20'">
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 2H15V11H10L8 14L6 11H1V2Z" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
          <span class="uppercase tracking-widest">Inbox</span>
          <Badge v-if="inboxCount > 0" variant="outline" class="ml-auto bg-ink text-white border-white">{{ inboxCount }}</Badge>
        </button>
      </RouterLink>

      <RouterLink to="/timeline" custom v-slot="{ navigate, isActive }">
        <button @click="navigate"
          class="w-full flex items-center gap-3 px-4 py-3 text-sm font-tech transition-all text-left"
          :class="isActive ? 'bg-primary text-primary-foreground border-r-3 border-ink shadow-standard translate-x-1' : 'hover:bg-ink/20'">
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="14" height="13" stroke="currentColor" stroke-width="2" />
            <path d="M1 6H15M5 1V4M11 1V4" stroke="currentColor" stroke-width="2" />
          </svg>
          <span class="uppercase tracking-widest">Timeline</span>
        </button>
      </RouterLink>

      <!-- Hatched Separator -->
      <Separator hatched class="my-6 opacity-30" />

      <!-- Projetos -->
      <div class="flex items-center justify-between px-2 py-2">
        <span class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] font-tech">Projects</span>
        <button @click="showAddProject = !showAddProject"
          class="w-6 h-6 flex items-center justify-center border border-white/20 hover:border-white transition-colors text-sm">+</button>
      </div>

      <!-- Add project form -->
      <form v-if="showAddProject" @submit.prevent="handleAddProject" class="px-2 mb-4 flex flex-col gap-2">
        <input v-model="newProjectName" autofocus placeholder="Project name…"
          class="w-full bg-ink text-white text-xs px-3 py-2 outline-none border-b-2 border-primary" />
        <div class="flex gap-2 items-center">
          <input type="color" v-model="newProjectColor" class="w-8 h-8 cursor-pointer bg-transparent border-0 p-0" />
          <button
            type="button"
            @click="cycleColorCombo"
            class="w-8 h-8 flex items-center justify-center border border-white/30 hover:border-white text-sm"
            title="Switch color combo"
          >🎨</button>
          <div class="flex items-center gap-1">
            <button
              v-for="color in activeColorCombo"
              :key="color"
              type="button"
              class="w-4 h-4 border border-white/20 hover:scale-110 transition-transform"
              :style="{ background: color }"
              @click="newProjectColor = color"
            />
          </div>
          <Button type="submit" size="sm" class="flex-1">Add</Button>
        </div>
      </form>

      <!-- Project list -->
      <RouterLink
        v-for="project in projectsStore.projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        custom
        v-slot="{ navigate, isActive }"
      >
        <button
          @click="navigate"
          class="flex items-center gap-3 px-4 py-2 text-xs font-tech transition-all text-left"
          :class="isActive ? 'bg-primary/20 border-l-3 border-primary text-white' : 'hover:bg-ink/10'">
          <ProjectColorPicker :project-id="project.id!" :color="project.color" :size="10" />
          <span class="truncate flex-1 uppercase tracking-wider">{{ project.name }}</span>
          <span v-if="getPendingCount(project.id!) > 0"
            class="text-[9px] font-bold opacity-50">{{ getPendingCount(project.id!) }}</span>
        </button>
      </RouterLink>

    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import ProjectColorPicker from '@/components/project/ProjectColorPicker.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const uiStore = useUIStore()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

const showAddProject = ref(false)
const newProjectName = ref('')
const newProjectColor = ref('#6366f1')

const inboxCount = computed(() => tasksStore.getInbox().length)
const activeColorCombo = computed(() => uiStore.activeProjectColors)

function getPendingCount(projectId: number) {
  return tasksStore.getByProject(projectId).filter(t => t.status !== 'done' && t.status !== 'archived').length
}

function cycleColorCombo() {
  uiStore.cycleThemeCombo()
  newProjectColor.value = uiStore.activeProjectColors[0]
}

async function handleAddProject() {
  const name = newProjectName.value.trim()
  if (!name) return
  await projectsStore.add(name, newProjectColor.value)
  newProjectName.value = ''
  showAddProject.value = false
}

</script>
