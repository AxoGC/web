<template>
  <NuxtLink :to="`/posts/${post.id}`" class="block h-full">
    <UiCard hoverable padded class="h-full flex flex-col">
      <div class="flex items-start gap-3 min-w-0">
        <UiAvatar :name="post.author?.username" :src="post.author?.avatar" size="sm" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <UiTag v-if="post.pinned" size="sm" variant="warning">{{ $t('forum.pinned') }}</UiTag>
            <h3 class="font-semibold text-text-primary hover:text-brand-400 truncate min-w-0 flex-1">{{ post.title }}</h3>
          </div>
          <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-text-tertiary">
            <span class="truncate max-w-[8rem]">{{ post.author?.username || '—' }}</span>
            <span>·</span>
            <span>{{ relative }}</span>
            <span class="inline-flex items-center gap-1"><LucideMessageCircle :size="12" />{{ post.comment_count }}</span>
            <span class="inline-flex items-center gap-1"><LucideEye :size="12" />{{ post.view_count }}</span>
          </div>
          <div v-if="post.tags?.length" class="mt-2 flex flex-wrap gap-1">
            <UiTag v-for="t in post.tags" :key="t.id" :color="t.color" size="sm">{{ t.name }}</UiTag>
          </div>
        </div>
      </div>

      <div
        v-if="post.latest_reply"
        class="mt-3 flex items-start gap-1.5 text-xs text-text-tertiary min-w-0"
      >
        <LucideCornerDownRight :size="12" class="shrink-0 mt-0.5" />
        <span class="font-medium text-text-secondary shrink-0 truncate max-w-[7rem]">
          {{ post.latest_reply.author.username || '—' }}:
        </span>
        <span class="truncate min-w-0">{{ post.latest_reply.content_excerpt }}</span>
      </div>
    </UiCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PostListItem } from '~/types/api'
import { relativeTime } from '~/utils/format'

const props = defineProps<{ post: PostListItem }>()
const { t } = useI18n()

const relative = computed(() => {
  const r = relativeTime(props.post.last_reply_at || props.post.created_at)
  if (r.kind === 'just_now') return t('common.just_now')
  if (r.kind === 'minutes_ago') return t('common.minutes_ago', { n: r.n })
  if (r.kind === 'hours_ago') return t('common.hours_ago', { n: r.n })
  if (r.kind === 'days_ago') return t('common.days_ago', { n: r.n })
  return r.date
})
</script>
