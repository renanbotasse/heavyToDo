<template>
  <editor-content :editor="editor" class="tiptap-editor" />
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps<{ content?: string }>()
const emit = defineEmits<{ (e: 'update', json: string): void }>()

const editor = useEditor({
  extensions: [StarterKit],
  editorProps: { attributes: { class: 'outline-none min-h-[80px] text-sm text-foreground' } },
  onUpdate: ({ editor }) => emit('update', JSON.stringify(editor.getJSON())),
})

watch(() => props.content, (val) => {
  if (!editor.value || !val) return
  try {
    const parsed = JSON.parse(val)
    if (JSON.stringify(editor.value.getJSON()) !== val) {
      editor.value.commands.setContent(parsed, false)
    }
  } catch {}
}, { immediate: true })

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
.tiptap-editor .ProseMirror p { margin-bottom: 0.5rem; }
.tiptap-editor .ProseMirror h1, h2, h3 { font-weight: 600; margin-bottom: 0.5rem; }
.tiptap-editor .ProseMirror ul, ol { padding-left: 1.25rem; }
.tiptap-editor .ProseMirror code { background: hsl(var(--secondary)); padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.85em; }
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}
</style>
