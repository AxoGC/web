<template>
  <div
    class="rich-editor border border-border-default rounded-md bg-bg-elevated focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/30 transition"
    :class="{ 'opacity-60 pointer-events-none': disabled }"
  >
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border-subtle"
      role="toolbar"
      aria-label="Editor toolbar"
    >
      <button v-for="b in toolbarButtons" :key="b.key" type="button"
        class="h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm hover:bg-bg-hover"
        :class="b.active() ? 'bg-bg-hover text-brand-400' : 'text-text-secondary'"
        :title="b.title"
        @click="b.run"
      >
        <component :is="b.icon" v-if="b.icon" :size="14" />
        <span v-else>{{ b.label }}</span>
      </button>
      <div class="w-px h-5 bg-border-subtle mx-1" />
      <button type="button" class="h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm hover:bg-bg-hover text-text-secondary"
        title="Undo" @click="editor.chain().focus().undo().run()">
        <LucideUndo2 :size="14" />
      </button>
      <button type="button" class="h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm hover:bg-bg-hover text-text-secondary"
        title="Redo" @click="editor.chain().focus().redo().run()">
        <LucideRedo2 :size="14" />
      </button>
    </div>
    <EditorContent
      :editor="editor"
      class="rich-editor__body p-4 min-h-[12rem] prose prose-invert max-w-none focus:outline-none"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import { useEditor, EditorContent, type Editor } from '@tiptap/vue-3'
import {
  LucideBold, LucideItalic, LucideStrikethrough, LucideCode, LucideHeading1, LucideHeading2,
  LucideHeading3, LucideList, LucideListOrdered, LucideQuote, LucideMinus, LucideLink, LucideCode2,
  LucideUndo2, LucideRedo2,
} from '#components'
import { tiptapExtensions, emptyDoc } from '~/utils/tiptap'

const props = withDefaults(defineProps<{
  modelValue?: object | null  // TipTap JSON doc
  placeholder?: string
  disabled?: boolean
}>(), {
  modelValue: () => emptyDoc(),
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [doc: object]
  'update:text': [text: string]
}>()

const editor = useEditor({
  content: props.modelValue || emptyDoc(),
  extensions: tiptapExtensions,
  editorProps: {
    attributes: {
      class: 'rich-editor__content focus:outline-none',
    },
  },
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getJSON())
    emit('update:text', editor.getText())
  },
}) as ReturnType<typeof useEditor>

// Keep editor content in sync if parent resets (e.g. after submit).
watch(() => props.modelValue, (val) => {
  if (!editor.value || !val) return
  // Only update if doc differs to avoid cursor jumps.
  const current = JSON.stringify(editor.value.getJSON())
  const incoming = JSON.stringify(val)
  if (current !== incoming) editor.value.commands.setContent(val)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const toolbarButtons = shallowRef<Array<{
  key: string
  title: string
  label?: string
  icon?: unknown
  active: () => boolean
  run: () => void
}>>([])

watch(editor, (e) => {
  if (!e) return
  toolbarButtons.value = makeToolbar(e)
}, { immediate: true })

function makeToolbar(e: Editor) {
  return [
    { key: 'bold', title: 'Bold', icon: LucideBold, active: () => e.isActive('bold'), run: () => e.chain().focus().toggleBold().run() },
    { key: 'italic', title: 'Italic', icon: LucideItalic, active: () => e.isActive('italic'), run: () => e.chain().focus().toggleItalic().run() },
    { key: 'strike', title: 'Strikethrough', icon: LucideStrikethrough, active: () => e.isActive('strike'), run: () => e.chain().focus().toggleStrike().run() },
    { key: 'code', title: 'Inline code', icon: LucideCode, active: () => e.isActive('code'), run: () => e.chain().focus().toggleCode().run() },
    { key: 'h1', title: 'Heading 1', icon: LucideHeading1, active: () => e.isActive('heading', { level: 1 }), run: () => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { key: 'h2', title: 'Heading 2', icon: LucideHeading2, active: () => e.isActive('heading', { level: 2 }), run: () => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: 'h3', title: 'Heading 3', icon: LucideHeading3, active: () => e.isActive('heading', { level: 3 }), run: () => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: 'ul', title: 'Bulleted list', icon: LucideList, active: () => e.isActive('bulletList'), run: () => e.chain().focus().toggleBulletList().run() },
    { key: 'ol', title: 'Numbered list', icon: LucideListOrdered, active: () => e.isActive('orderedList'), run: () => e.chain().focus().toggleOrderedList().run() },
    { key: 'quote', title: 'Blockquote', icon: LucideQuote, active: () => e.isActive('blockquote'), run: () => e.chain().focus().toggleBlockquote().run() },
    { key: 'codeblock', title: 'Code block', icon: LucideCode2, active: () => e.isActive('codeBlock'), run: () => e.chain().focus().toggleCodeBlock().run() },
    { key: 'hr', title: 'Horizontal rule', icon: LucideMinus, active: () => false, run: () => e.chain().focus().setHorizontalRule().run() },
    { key: 'link', title: 'Link', icon: LucideLink, active: () => e.isActive('link'), run: () => toggleLink(e) },
  ]
}

function toggleLink(e: Editor) {
  if (e.isActive('link')) {
    e.chain().focus().unsetLink().run()
    return
  }
  const href = typeof window !== 'undefined' ? window.prompt('URL') : null
  if (!href) return
  e.chain().focus().extendMarkRange('link').setLink({ href }).run()
}
</script>

<style scoped>
.rich-editor__body :deep(.ProseMirror) {
  min-height: 10rem;
  outline: none;
}
.rich-editor__body :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: var(--color-text-tertiary, #999);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
.rich-editor__body :deep(pre) {
  background: var(--color-bg-overlay, #1a1a1a);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  overflow-x: auto;
}
.rich-editor__body :deep(code) {
  background: var(--color-bg-overlay, #1a1a1a);
  padding: 2px 4px;
  border-radius: 4px;
}
.rich-editor__body :deep(blockquote) {
  border-left: 3px solid var(--color-border-default, #444);
  padding-left: 0.75rem;
  color: var(--color-text-secondary, #aaa);
}
</style>
