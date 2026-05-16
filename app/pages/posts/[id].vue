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
          <UiTag v-if="post.voting_enabled" variant="info">{{ $t('forum.voting_tag') }}</UiTag>
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

      <article class="bg-bg-elevated border border-border-subtle rounded-lg p-6">
        <RichContent :doc="post.content_json" />
      </article>

      <section v-if="post.voting_enabled && post.voting_summary" class="mt-4 bg-bg-elevated border border-border-subtle rounded-lg p-4">
        <div class="text-sm font-semibold mb-3">{{ $t('forum.voting_summary') }}</div>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <div class="text-2xl font-bold text-success">{{ post.voting_summary.affirmative }}</div>
            <div class="text-xs text-text-tertiary mt-1">{{ $t('forum.voting_affirmative') }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-text-secondary">{{ post.voting_summary.neutral }}</div>
            <div class="text-xs text-text-tertiary mt-1">{{ $t('forum.voting_neutral') }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-danger">{{ post.voting_summary.negative }}</div>
            <div class="text-xs text-text-tertiary mt-1">{{ $t('forum.voting_negative') }}</div>
          </div>
        </div>
      </section>

      <div class="mt-4 flex items-center gap-3">
        <UiButton
          :variant="liked ? 'primary' : 'outline'"
          :loading="likeBusy"
          size="sm"
          @click="toggleLike"
        >
          <template #leading><LucideHeart :size="14" :fill="liked ? 'currentColor' : 'none'" /></template>
          {{ likeCount }}
        </UiButton>
      </div>

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
          <div v-if="post.voting_enabled" class="mt-2 flex items-center gap-3 text-sm">
            <span class="text-text-tertiary">{{ $t('forum.attitude_prompt') }}</span>
            <label v-for="opt in attitudeOptions" :key="opt.value" class="inline-flex items-center gap-1 cursor-pointer">
              <input v-model="commentAttitude" type="radio" :value="opt.value" class="accent-brand-500">
              <span :class="opt.color">{{ opt.label }}</span>
            </label>
          </div>
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
              <UiTag v-if="post.voting_enabled && c.attitude !== 2" size="sm"
                :variant="c.attitude === 1 ? 'success' : 'danger'">
                {{ c.attitude === 1 ? $t('forum.voting_affirmative') : $t('forum.voting_negative') }}
              </UiTag>
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
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { formatDate } from '~/utils/format'
import type { PostDetail, CommentItem, CommentAttitude } from '~/types/api'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const id = computed(() => String(route.params.id))
const commentDraft = ref('')
const commentAttitude = ref<CommentAttitude>(2)
const commentSubmitting = ref(false)
const likeBusy = ref(false)
const liked = ref(false)
const likeCount = ref(0)

const { data: post, error } = await useAsyncData(
  () => `post.${id.value}`,
  () => useApi<PostDetail>(`/api/posts/${id.value}`),
)

watch(post, (p) => {
  if (!p) return
  liked.value = p.liked
  likeCount.value = p.like_count
}, { immediate: true })

useHead(() => ({ title: post.value?.title || 'Post' }))

const { data: comments, pending: pendingComments, refresh: refreshComments } = await useAsyncData(
  () => `post.comments.${id.value}`,
  () => useApi<{ items: CommentItem[], total: number }>(`/api/posts/${id.value}/comments?page=1&size=50`),
)

const attitudeOptions = computed(() => [
  { value: 1 as const, label: t('forum.voting_affirmative'), color: 'text-success' },
  { value: 2 as const, label: t('forum.voting_neutral'), color: 'text-text-secondary' },
  { value: 3 as const, label: t('forum.voting_negative'), color: 'text-danger' },
])

async function submitComment() {
  if (!commentDraft.value.trim()) return
  commentSubmitting.value = true
  try {
    const body: Record<string, unknown> = { content: commentDraft.value }
    if (post.value?.voting_enabled) body.attitude = commentAttitude.value
    await useApi(`/api/posts/${id.value}/comments`, { method: 'POST', body })
    commentDraft.value = ''
    commentAttitude.value = 2
    toast.success(t('forum.comment_created'))
    await refreshComments()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    commentSubmitting.value = false
  }
}

async function toggleLike() {
  if (!auth.isLoggedIn) {
    toast.error(t('common.not_logged_in'))
    return
  }
  likeBusy.value = true
  try {
    const r = await useApi<{ liked: boolean, like_count: number }>(
      `/api/posts/${id.value}/like`,
      { method: liked.value ? 'DELETE' : 'POST' },
    )
    liked.value = r.liked
    likeCount.value = r.like_count
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    likeBusy.value = false
  }
}

function humanSize(b: number) {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}
</script>
