<template>
  <UiCard v-if="topTags.length" padded>
    <h3 class="font-semibold text-sm mb-3">{{ $t('forum.rail_hot_tags') }}</h3>
    <div class="flex flex-wrap gap-1.5">
      <UiTag
        v-for="t in topTags"
        :key="t.id"
        :color="t.color"
        :size="weightSize(t.post_count || 0)"
      >
        {{ t.name }}
        <span class="opacity-70 tabular-nums">{{ t.post_count }}</span>
      </UiTag>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tag } from '~/types/api'

const { data } = await useAsyncData('rail.tags', () =>
  useApi<{ items: Tag[] }>('/api/tags'),
)

const topTags = computed(() => {
  const rows = data.value?.items ?? []
  return [...rows]
    .filter(t => (t.post_count ?? 0) > 0)
    .sort((a, b) => (b.post_count ?? 0) - (a.post_count ?? 0))
    .slice(0, 10)
})

const maxCount = computed(() => topTags.value[0]?.post_count ?? 1)

function weightSize(c: number): 'sm' | 'md' {
  // Lazy bucket: top half = md, bottom half = sm. Good-enough visual weighting
  // without introducing a third size that drags layout in narrow rail.
  return c >= maxCount.value / 2 ? 'md' : 'sm'
}
</script>
