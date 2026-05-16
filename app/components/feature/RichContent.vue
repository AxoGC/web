<template>
  <div class="rich-content prose prose-invert max-w-none" v-html="html" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { generateHTML } from '@tiptap/html'
import { tiptapExtensions, isEmptyDoc } from '~/utils/tiptap'

const props = defineProps<{
  doc?: object | null
}>()

const html = ref('')

watch(() => props.doc, async (val) => {
  html.value = await render(val)
}, { immediate: true })

async function render(doc: unknown): Promise<string> {
  if (!doc || isEmptyDoc(doc)) return ''
  let raw = ''
  try {
    raw = generateHTML(doc as Parameters<typeof generateHTML>[0], tiptapExtensions)
  } catch {
    return ''
  }
  // Lazy-load DOMPurify only on the client; SSR ships raw HTML and the
  // browser re-sanitizes on hydration. The doc itself is generated from a
  // strict TipTap schema, so this is a defense-in-depth pass — not the
  // primary XSS boundary.
  if (typeof window === 'undefined') return raw
  try {
    const PurifyMod = await import('dompurify')
    const DOMPurify = (PurifyMod as { default: { sanitize(s: string, opts?: Record<string, unknown>): string } }).default
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
  } catch {
    return raw
  }
}

defineExpose({ html: computed(() => html.value) })
</script>

<style scoped>
.rich-content :deep(pre) {
  background: var(--color-bg-overlay, #1a1a1a);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  overflow-x: auto;
}
.rich-content :deep(code) {
  background: var(--color-bg-overlay, #1a1a1a);
  padding: 2px 4px;
  border-radius: 4px;
}
.rich-content :deep(blockquote) {
  border-left: 3px solid var(--color-border-default, #444);
  padding-left: 0.75rem;
  color: var(--color-text-secondary, #aaa);
}
.rich-content :deep(a) {
  color: var(--color-brand-400, #60a5fa);
  text-decoration: underline;
}
</style>
