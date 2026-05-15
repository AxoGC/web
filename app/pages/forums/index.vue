<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('forum.list_title') }}</h1>
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiSkeleton v-for="i in 4" :key="i" variant="card" :height="100" />
    </div>
    <div v-else-if="!data?.items?.length">
      <UiEmpty :message="$t('empty.posts')" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NuxtLink
        v-for="f in data.items"
        :key="f.id"
        :to="`/forums/${f.slug}`"
        class="block"
      >
        <UiCard hoverable padded>
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-lg bg-brand-soft text-brand-400 grid place-items-center shrink-0">
              <LucideHash :size="20" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-text-primary hover:text-brand-400 truncate">{{ f.name }}</h3>
              <p v-if="f.description" class="text-sm text-text-secondary mt-0.5 line-clamp-2">{{ f.description }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
                <span class="inline-flex items-center gap-1">
                  <LucideMessageSquare :size="12" />
                  {{ $t('forum.total_posts') }}: {{ f.post_count }}
                </span>
                <span v-if="f.today_new_count != null" class="inline-flex items-center gap-1">
                  <LucideSparkles :size="12" />
                  {{ $t('forum.today_new') }}: {{ f.today_new_count }}
                </span>
                <span v-if="f.active_users_7d != null" class="inline-flex items-center gap-1">
                  <LucideUsers :size="12" />
                  {{ $t('forum.active_7d') }}: {{ f.active_users_7d }}
                </span>
              </div>
            </div>
          </div>
        </UiCard>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Forum } from '~/types/api'

definePageMeta({ layout: 'default' })
useHead({ title: 'Forums' })

const { data, pending } = await useAsyncData('forums.list', () =>
  useApi<{ items: Forum[] }>('/api/forums'),
)
</script>
