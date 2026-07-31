<template>
  <UiCard v-if="items.length" padded>
    <h3 class="text-sm">{{ $t('forum.rail_active_title') }}</h3>
    <p class="text-xs text-text-tertiary mt-0.5 mb-3">{{ $t('forum.rail_active_subtitle') }}</p>
    <ul class="space-y-2">
      <li
        v-for="u in items"
        :key="u.id"
      >
        <NuxtLink :to="`/users/${u.id}`" class="flex items-center gap-2 group min-w-0">
          <UiAvatar :name="u.username" :src="u.avatar" size="xs" />
          <span class="text-sm truncate group-hover:text-brand-400">{{ u.username }}</span>
        </NuxtLink>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserSummary } from '~/types/api'

const { data } = await useAsyncData('rail.active_users', () =>
  useApi<{ items: UserSummary[] }>('/api/users/active?days=3&size=5'),
)

const items = computed(() => data.value?.items ?? [])
</script>
