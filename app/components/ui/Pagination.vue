<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 select-none">
    <button
      class="page-btn"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
    >
      <LucideChevronLeft :size="16" />
    </button>
    <template v-for="(p, i) in pages" :key="i">
      <span v-if="p === '…'" class="px-2 text-text-tertiary">…</span>
      <button
        v-else
        :class="['page-btn', p === page ? 'page-btn-active' : '']"
        @click="emit('update:page', p as number)"
      >
        {{ p }}
      </button>
    </template>
    <button
      class="page-btn"
      :disabled="page >= totalPages"
      @click="emit('update:page', page + 1)"
    >
      <LucideChevronRight :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{ 'update:page': [value: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed<(number | '…')[]>(() => {
  const tp = totalPages.value
  const p = props.page
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  if (p > 3) out.push('…')
  for (let i = Math.max(2, p - 1); i <= Math.min(tp - 1, p + 1); i++) out.push(i)
  if (p < tp - 2) out.push('…')
  out.push(tp)
  return out
})
</script>

<style scoped>
.page-btn {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  background: var(--bg-elevated);
  transition: all 120ms ease;
}
.page-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-btn-active {
  background: var(--brand-500);
  color: var(--brand-on);
  border-color: var(--brand-500);
}
</style>
