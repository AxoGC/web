<template>
  <div class="flex items-start gap-3">
    <div
      :class="[
        'w-11 h-11 rounded-lg grid place-items-center shrink-0',
        inverted ? 'bg-white/15 text-white' : 'bg-brand-soft text-brand-400',
      ]"
    >
      <LucideHash :size="20" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 :class="['font-semibold truncate', inverted ? 'text-white' : 'text-text-primary group-hover:text-brand-400']">
        {{ forum.name }}
      </h3>
      <p
        v-if="forum.description"
        :class="['text-sm mt-0.5 line-clamp-2', inverted ? 'text-white/85' : 'text-text-secondary']"
      >
        {{ forum.description }}
      </p>
      <div
        :class="[
          'mt-3 flex flex-wrap items-center gap-4 text-xs',
          inverted ? 'text-white/80' : 'text-text-tertiary',
        ]"
      >
        <span class="inline-flex items-center gap-1">
          <LucideMessageSquare :size="12" />
          {{ $t('forum.total_posts') }}: {{ forum.post_count }}
        </span>
        <span v-if="forum.today_new_count != null" class="inline-flex items-center gap-1">
          <LucideSparkles :size="12" />
          {{ $t('forum.today_new') }}: {{ forum.today_new_count }}
        </span>
        <span v-if="forum.active_users_7d != null" class="inline-flex items-center gap-1">
          <LucideUsers :size="12" />
          {{ $t('forum.active_7d') }}: {{ forum.active_users_7d }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Forum } from '~/types/api'

withDefaults(defineProps<{ forum: Forum, inverted?: boolean }>(), { inverted: false })
</script>
