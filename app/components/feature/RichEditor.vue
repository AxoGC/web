<template>
  <div
    class="rich-editor border border-border-default rounded-md bg-bg-elevated focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/30 transition"
    :class="{ 'opacity-60 pointer-events-none': disabled }"
    @drop.prevent="onDrop"
    @dragover.prevent
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
        :title="$t('actions.upload') || 'Image'"
        :disabled="uploading"
        @click="pickFile">
        <LucideImage :size="14" />
      </button>
      <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileChange">
      <button type="button" class="h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm hover:bg-bg-hover text-text-secondary"
        title="Undo" @click="editor.chain().focus().undo().run()">
        <LucideUndo2 :size="14" />
      </button>
      <button type="button" class="h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm hover:bg-bg-hover text-text-secondary"
        title="Redo" @click="editor.chain().focus().redo().run()">
        <LucideRedo2 :size="14" />
      </button>
      <span v-if="uploading" class="ml-2 text-xs text-text-tertiary">{{ $t('common.loading') }}</span>
    </div>
    <EditorContent
      :editor="editor"
      class="rich-editor__body p-4 min-h-[12rem] prose prose-invert max-w-none focus:outline-none"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useEditor, EditorContent, type Editor } from '@tiptap/vue-3'
import {
  LucideBold, LucideItalic, LucideStrikethrough, LucideCode, LucideHeading1, LucideHeading2,
  LucideHeading3, LucideList, LucideListOrdered, LucideQuote, LucideMinus, LucideLink, LucideCode2,
  LucideUndo2, LucideRedo2, LucideImage,
} from '#components'
import { tiptapExtensions, emptyDoc } from '~/utils/tiptap'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = withDefaults(defineProps<{
  modelValue?: object | null  // TipTap JSON doc
  /** Companion list of attachment ids the editor has uploaded. Kept in
   *  parallel to the doc (not embedded in it) so submit can stamp post_id
   *  by id list rather than walking the doc. v-model:attachmentIds. */
  attachmentIds?: number[]
  placeholder?: string
  disabled?: boolean
}>(), {
  modelValue: () => emptyDoc(),
  attachmentIds: () => [],
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [doc: object]
  'update:text': [text: string]
  'update:attachmentIds': [ids: number[]]
}>()

const toast = useToast()

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

// ---------- image upload ----------
//
// The editor is in charge of POSTing the file to /api/attachments (draft
// upload), inserting an <img> node with the returned URL, and pushing the
// returned id onto the attachmentIds model so the parent form can submit it
// as `attachment_ids[]`. Three entry points: toolbar button, drag-drop, and
// paste of clipboard images.

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function pickFile() { fileInput.value?.click() }

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length) uploadAll(Array.from(input.files))
  // Reset so picking the same file again still fires change.
  input.value = ''
}

function onDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (!files || !files.length) return
  const images = Array.from(files).filter(f => f.type.startsWith('image/'))
  if (images.length) uploadAll(images)
}

async function uploadAll(files: File[]) {
  uploading.value = true
  try {
    for (const f of files) await uploadOne(f)
  } finally {
    uploading.value = false
  }
}

async function uploadOne(file: File) {
  const form = new FormData()
  form.append('file', file)
  try {
    const r = await useApi<{ id: number, url: string }>('/api/attachments', { form })
    if (editor.value && r.url) {
      // Use the existing chain; insertContent accepts a TipTap node JSON.
      editor.value.chain().focus().insertContent({
        type: 'image',
        attrs: { src: r.url, alt: file.name },
      }).run()
    }
    if (typeof r.id === 'number') {
      emit('update:attachmentIds', [...props.attachmentIds, r.id])
    }
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  }
}

// Paste handler: ProseMirror exposes pasted clipboard files via `handlePaste`,
// but using a native DOM listener on the editor container is simpler and the
// editor still receives the eventual insertContent call.
watch(editor, (e) => {
  if (!e) return
  const dom = e.view?.dom
  if (!dom) return
  const onPaste = (ev: ClipboardEvent) => {
    const files = ev.clipboardData?.files
    if (!files || !files.length) return
    const images = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!images.length) return
    ev.preventDefault()
    uploadAll(images)
  }
  dom.addEventListener('paste', onPaste)
  // Cleanup tied to editor destroy — when the editor is recreated (rare) we
  // rely on the next watch firing on the fresh dom.
})

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
