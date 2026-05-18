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
          'mt-3 flex flex-wrap items-center gap-3 text-xs',
          inverted ? 'text-white/80' : 'text-text-tertiary',
        ]"
      >
        <span class="inline-flex items-center gap-1" :title="$t('forum.stat_posts_tip')">
          <LucideMessageSquare :size="12" />
          {{ formatNumber(forum.post_count || 0) }}
        </span>
        <span class="inline-flex items-center gap-1" :title="$t('forum.stat_comments_tip')">
          <LucideMessageCircle :size="12" />
          {{ formatNumber(forum.comment_count || 0) }}
        </span>
        <span class="inline-flex items-center gap-1" :title="$t('forum.stat_views_tip')">
          <LucideEye :size="12" />
          {{ formatNumber(forum.view_count || 0) }}
        </span>
      </div>

      <div
        v-if="forum.latest_post"
        :class="[
          'mt-3 flex items-center gap-1.5 text-xs min-w-0',
          inverted ? 'text-white/80' : 'text-text-tertiary',
        ]"
      >
        <LucideClock :size="12" class="shrink-0" />
        <span class="truncate min-w-0" :class="inverted ? 'text-white/90' : 'text-text-secondary'">
          {{ forum.latest_post.title }}
        </span>
        <span class="shrink-0">·</span>
        <span class="shrink-0">{{ forum.latest_post.author.username }}</span>
      </div>
      <div
        v-else
        :class="[
          'mt-3 text-xs italic',
          inverted ? 'text-white/60' : 'text-text-tertiary',
        ]"
      >
        {{ $t('forum.no_posts_yet') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Forum } from '~/types/api'
import { formatNumber } from '~/utils/format'

withDefaults(defineProps<{ forum: Forum, inverted?: boolean }>(), { inverted: false })
</script>
