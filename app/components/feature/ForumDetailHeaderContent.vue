<template>
  <div class="flex items-start gap-3">
    <NuxtLink
      to="/forums"
      :class="[
        'mt-1.5 transition-colors',
        inverted ? 'text-white/80 hover:text-white' : 'text-text-tertiary hover:text-text-primary',
      ]"
    >
      <LucideChevronLeft :size="20" />
    </NuxtLink>
    <div class="flex-1 min-w-0">
      <h1
        :class="[
          'text-2xl truncate',
          inverted ? 'text-white' : 'text-text-primary',
        ]"
      >
        {{ forum?.name || '…' }}
      </h1>
      <p
        v-if="forum?.description"
        :class="[
          'mt-1 text-sm line-clamp-2',
          inverted ? 'text-white/85' : 'text-text-secondary',
        ]"
      >
        {{ forum.description }}
      </p>
    </div>
    <NuxtLink :to="forum ? `/posts/new?forum_id=${forum.id}` : '#'">
      <UiButton
        variant="primary"
        size="sm"
        :disabled="!auth.isLoggedIn"
        :class="inverted ? 'shadow-lg' : ''"
      >
        <template #leading><LucidePlus :size="16" /></template>
        {{ $t('forum.new_post') }}
      </UiButton>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Forum } from '~/types/api'

withDefaults(
  defineProps<{
    forum: Forum | null | undefined
    auth: { isLoggedIn: boolean }
    inverted?: boolean
  }>(),
  { inverted: false },
)
</script>
