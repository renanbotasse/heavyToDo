<template>
  <div class="flex flex-col h-full bg-white relative">
    <!-- Header -->
    <div class="flex items-center gap-4 px-6 py-4 border-b-3 border-ink flex-shrink-0 bg-parchment-container">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-ink"></span>
        <label class="text-[9px] font-bold font-tech uppercase tracking-[0.2em] opacity-40">Document ID</label>
      </div>
      <input v-if="doc" v-model="titleDraft" @input="queueSave"
        class="flex-1 bg-transparent text-xl font-display italic font-bold text-ink outline-none border-b-2 border-transparent focus:border-primary transition-colors" />
      <span v-else class="text-xs font-tech font-bold uppercase tracking-widest opacity-20">No active records</span>
      <div v-if="saving" class="flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span class="text-[10px] font-tech font-bold uppercase tracking-widest text-primary">Syncing...</span>
      </div>
    </div>

    <!-- Workspace -->
    <div v-if="doc" class="flex-1 overflow-y-auto p-12 bg-white relative">
      <!-- Decorative lines -->
      <div class="absolute top-0 right-12 bottom-0 w-[1px] bg-ink/5 pointer-events-none"></div>
      <div class="absolute top-0 right-16 bottom-0 w-[2px] bg-ink/5 pointer-events-none"></div>
      
      <editor-content :editor="editor" class="tiptap-editor prose prose-stone max-w-none min-h-full font-serif" />
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex flex-col items-center justify-center p-12">
      <div class="border-3 border-ink border-dashed p-12 flex flex-col items-center gap-6 bg-parchment/10">
        <div class="text-xs font-tech font-bold uppercase tracking-[0.3em] opacity-30">Archives Empty</div>
        <Button @click="createDoc" variant="default" size="lg" class="h-14 px-8">
          + INITIALIZE NEW ENTRY
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { db } from '@/db'
import { AutosaveQueue } from '@/services/autosave'
import { Button } from '@/components/ui/button'
import type { Doc, ID } from '@/entities'

const props = defineProps<{ projectId: ID }>()

const doc = ref<Doc | null>(null)
const titleDraft = ref('')
const saving = ref(false)
const autosave = new AutosaveQueue()

const editor = useEditor({
  extensions: [StarterKit],
  editorProps: { attributes: { class: 'outline-none text-sm text-foreground' } },
  onUpdate: () => queueSave(),
})

async function loadDoc() {
  doc.value = await db.docs.where('projectId').equals(props.projectId).first() ?? null
  if (doc.value) {
    titleDraft.value = doc.value.title
    if (doc.value.content && editor.value) {
      try { editor.value.commands.setContent(JSON.parse(doc.value.content), false) } catch {}
    }
  }
}

async function createDoc() {
  const id = await db.docs.add({
    projectId: props.projectId,
    title: 'Notes',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  doc.value = (await db.docs.get(id))!
  titleDraft.value = doc.value.title
  editor.value?.commands.clearContent()
}

function queueSave() {
  autosave.schedule(async () => {
    if (!doc.value?.id) return
    saving.value = true
    await db.docs.update(doc.value.id, {
      title: titleDraft.value,
      content: JSON.stringify(editor.value?.getJSON()),
      updatedAt: new Date(),
    })
    saving.value = false
  })
}

watch(() => props.projectId, loadDoc, { immediate: true })

onBeforeUnmount(() => {
  editor.value?.destroy()
  autosave.flush()
})
</script>
