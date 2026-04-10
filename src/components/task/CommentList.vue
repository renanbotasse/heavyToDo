<template>
  <div class="flex flex-col gap-6">
    <div v-for="comment in commentsStore.getForTask(taskId)" :key="comment.id"
      class="group relative bg-white border-2 border-ink shadow-[2px_2px_0_0_#0D0D0D] p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[9px] font-tech font-bold uppercase tracking-widest text-ink/40">{{ formatDate(comment.createdAt) }}</span>
        <button @click="commentsStore.remove(taskId, comment.id!)"
          class="text-xs text-ink/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-all font-bold">✕ DELETE RECORD</button>
      </div>
      <p class="text-sm font-sans text-ink whitespace-pre-wrap">{{ comment.text }}</p>
    </div>

    <div v-if="commentsStore.getForTask(taskId).length === 0" class="border-2 border-ink border-dashed p-6 text-center">
      <p class="text-[9px] font-tech font-bold uppercase tracking-widest text-ink/20">Zero intelligence logs detected</p>
    </div>

    <div class="flex flex-col gap-3 mt-4">
      <div class="flex flex-col gap-1">
        <label class="text-[9px] font-bold font-tech uppercase tracking-widest text-ink/50">New Intel Log</label>
        <textarea v-model="newText" placeholder="RECORD YOUR OBSERVATIONS..." rows="3"
          class="w-full bg-white text-ink text-sm border-3 border-ink p-4 outline-none focus:border-primary transition-colors resize-none placeholder:text-ink/20 shadow-standard"
          @keydown.ctrl.enter="handleSubmit"
          @keydown.meta.enter="handleSubmit" />
      </div>
      <div class="flex justify-end">
        <Button @click="handleSubmit" variant="default" size="default" class="h-12 px-8">
          EXECUTE LOG
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { useCommentsStore } from '@/stores/comments'
import { Button } from '@/components/ui/button'
import type { ID } from '@/entities'

const props = defineProps<{ taskId: ID }>()
const commentsStore = useCommentsStore()
const newText = ref('')

onMounted(() => commentsStore.loadForTask(props.taskId))

function formatDate(d: Date) {
  return formatDistanceToNow(new Date(d), { addSuffix: true })
}

async function handleSubmit() {
  const text = newText.value.trim()
  if (!text) return
  await commentsStore.add(props.taskId, text)
  newText.value = ''
}
</script>
