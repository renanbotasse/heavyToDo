<template>
  <!-- Marcador de cor clicável -->
  <button
    type="button"
    class="flex-shrink-0 border border-ink/30 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring ring-offset-1 ring-offset-background"
    :style="{ background: color, width: size + 'px', height: size + 'px' }"
    @click.stop="open = true"
  />

  <!-- Modal via Teleport → fora de qualquer contexto de overflow -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="open = false"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" />

        <!-- Painel centralizado -->
        <div class="relative bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5 w-80">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project color</p>
          <div class="grid grid-cols-6 gap-3">
            <button
              v-for="c in PALETTE"
              :key="c"
              type="button"
              class="w-9 h-9 rounded-full transition-transform hover:scale-110 focus:outline-none"
              :style="{ background: c }"
              :class="c === color ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : ''"
              @click="pick(c)"
            />
          </div>
          <button
            class="text-xs text-muted-foreground hover:text-foreground transition-colors self-end"
            @click="open = false"
          >Cancel</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { ID } from '@/entities'

const props = defineProps<{
  projectId: ID
  color: string
  size?: number
}>()

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#6366f1', '#14b8a6',
]

const projectsStore = useProjectsStore()
const open = ref(false)

async function pick(c: string) {
  await projectsStore.update(props.projectId, { color: c })
  open.value = false
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
