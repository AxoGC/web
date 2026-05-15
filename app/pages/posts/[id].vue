<template>
  <div>
    <template v-if="post">
      <header class="mb-6">
        <div class="flex items-center gap-2 text-sm text-text-tertiary mb-3">
          <NuxtLink :to="`/forums/${post.forum.slug}`" class="hover:text-brand-400">
            <LucideHash :size="12" class="inline mr-1" />{{ post.forum.name }}
          </NuxtLink>
        </div>
        <div class="flex items-start gap-3 flex-wrap mb-2">
          <h1 class="text-2xl md:text-3xl font-bold flex-1">{{ post.title }}</h1>
          <UiTag v-if="post.pinned" variant="warning">{{ $t('forum.pinned') }}</UiTag>
          <UiTag v-if="post.locked" variant="default">{{ $t('forum.locked') }}</UiTag>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
          <NuxtLink :to="`/users/${post.author.id}`" class="flex items-center gap-2 hover:text-brand-400">
            <UiAvatar :src="post.author.avatar" :name="post.author.username" size="xs" />
            {{ post.author.username }}
          </NuxtLink>
          <span>·</span>
          <span>{{ formatDate(post.created_at) }}</span>
          <span class="inline-flex items-center gap-1"><LucideEye :size="14" />{{ post.view_count }}</span>
          <span class="inline-flex items-center gap-1"><LucideMessageCircle :size="14" />{{ post.comment_count }}</span>
        </div>
        <div v-if="post.tags?.length" class="mt-3 flex flex-wrap gap-1.5">
          <UiTag v-for="t in post.tags" :key="t.id" :color="t.color" size="sm">{{ t.name }}</UiTag>
        </div>
      </header>

      <article class="markdown-body bg-bg-elevated border border-border-subtle rounded-lg p-6" v-html="renderedHtml" />

      <section v-if="post.attachments?.length" class="mt-4">
        <h3 class="text-sm font-semibold text-text-secondary mb-2">Attachments</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <a
            v-for="a in post.attachments"
            :key="a.id"
            :href="a.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-3 py-2 rounded-md bg-bg-elevated border border-border-subtle hover:bg-bg-overlay text-sm"
          >
            <LucidePaperclip :size="14" class="text-text-tertiary" />
            <span class="flex-1 truncate">{{ a.filename }}</span>
            <span class="text-xs text-text-tertiary">{{ humanSize(a.size) }}</span>
          </a>
        </div>
      </section>

      <section class="mt-10">
        <h2 class="text-lg font-semibold mb-4">{{ $t('forum.comments') }} ({{ post.comment_count }})</h2>

        <div v-if="auth.isLoggedIn && !post.locked" class="mb-6">
          <UiTextarea v-model="commentDraft" :rows="4" :placeholder="$t('forum.reply_placeholder')" />
          <div class="mt-2 flex justify-end">
            <UiButton :loading="commentSubmitting" :disabled="!commentDraft.trim()" @click="submitComment">
              {{ $t('forum.reply') }}
            </UiButton>
          </div>
        </div>
        <div v-else-if="!auth.isLoggedIn" class="mb-6 text-sm text-text-tertiary">
          <NuxtLink to="/login" class="text-brand-400">{{ $t('common.go_login') }}</NuxtLink>
        </div>

        <div v-if="pendingComments" class="space-y-3">
          <UiSkeleton v-for="i in 3" :key="i" :height="80" />
        </div>
        <div v-else-if="!comments?.items?.length">
          <p class="text-sm text-text-tertiary text-center py-6">{{ $t('forum.no_comments') }}</p>
        </div>
        <ul v-else class="space-y-3">
          <li v-for="c in comments.items" :key="c.id" class="bg-bg-elevated border border-border-subtle rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <UiAvatar :src="c.author.avatar" :name="c.author.username" size="xs" />
              <NuxtLink :to="`/users/${c.author.id}`" class="text-sm font-medium hover:text-brand-400">
                {{ c.author.username }}
              </NuxtLink>
              <span class="text-xs text-text-tertiary">·</span>
              <span class="text-xs text-text-tertiary">{{ formatDate(c.created_at) }}</span>
            </div>
            <div class="text-text-primary text-sm whitespace-pre-wrap break-words">{{ c.content }}</div>
          </li>
        </ul>
      </section>
    </template>

    <div v-else-if="error">
      <UiEmpty :message="$t('errors.POST_NOT_FOUND')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { formatDate } from '~/utils/format'
import { renderMarkdown } from '~/utils/markdown'
import type { PostDetail, CommentItem } from '~/types/api'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const id = computed(() => String(route.params.id))
const renderedHtml = ref('')
const commentDraft = ref('')
const commentSubmitting = ref(false)

const { data: post, error } = await useAsyncData(
  () => `post.${id.value}`,
  () => useApi<PostDetail>(`/api/posts/${id.value}`),
)

useHead(() => ({ title: post.value?.title || 'Post' }))

watch(post, async (p) => {
  if (p?.content) renderedHtml.value = await renderMarkdown(p.content)
  else renderedHtml.value = ''
}, { immediate: true })

const { data: comments, pending: pendingComments, refresh: refreshComments } = await useAsyncData(
  () => `post.comments.${id.value}`,
  () => useApi<{ items: CommentItem[], total: number }>(`/api/posts/${id.value}/comments?page=1&size=50`),
)

async function submitComment() {
  if (!commentDraft.value.trim()) return
  commentSubmitting.value = true
  try {
    await useApi(`/api/posts/${id.value}/comments`, {
      method: 'POST',
      body: { content: commentDraft.value },
    })
    commentDraft.value = ''
    toast.success(t('forum.comment_created'))
    await refreshComments()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    commentSubmitting.value = false
  }
}

function humanSize(b: number) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}
</script>
