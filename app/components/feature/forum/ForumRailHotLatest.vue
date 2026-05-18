<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-sm">{{ $t('forum.rail_feed_title') }}</h3>
      <div class="inline-flex rounded-md bg-bg-overlay p-0.5 text-xs">
        <button
          v-for="m in (['hot','latest'] as const)"
          :key="m"
          :class="[
            'px-2 h-6 rounded transition-colors',
            mode === m ? 'bg-bg-base text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary',
          ]"
          @click="mode = m"
        >
          {{ m === 'hot' ? $t('forum.rail_mode_hot') : $t('forum.rail_mode_latest') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 5" :key="i" :height="40" />
    </div>
    <div v-else-if="!items?.length" class="text-xs text-text-tertiary py-4 text-center">
      {{ $t('empty.posts') }}
    </div>
    <ul v-else class="space-y-2">
      <li v-for="p in items" :key="p.id">
        <NuxtLink :to="`/posts/${p.id}`" class="block group">
          <div class="text-sm text-text-primary group-hover:text-brand-400 truncate">
            {{ p.title }}
          </div>
          <div class="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary min-w-0">
            <NuxtLink
              :to="`/forums/${p.forum.slug}`"
              class="shrink-0 truncate max-w-[6rem] hover:text-brand-400"
              @click.stop
            >
              #{{ p.forum.name }}
            </NuxtLink>
            <span class="shrink-0">·</span>
            <span class="inline-flex items-center gap-0.5"><LucideMessageCircle :size="11" />{{ p.comment_count }}</span>
            <span class="inline-flex items-center gap-0.5"><LucideEye :size="11" />{{ p.view_count }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FeedPostItem } from '~/types/api'

const mode = ref<'hot' | 'latest'>('hot')

const { data, pending } = await useAsyncData(
  () => `rail.feed.${mode.value}`,
  () => useApi<{ items: FeedPostItem[] }>(`/api/posts/feed?mode=${mode.value}&size=5`),
  { watch: [mode] },
)

const items = computed(() => data.value?.items ?? [])
</script>
