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

      <section v-if="post.voting_enabled && post.poll_options?.length" class="mt-4 bg-bg-elevated border border-border-subtle rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-semibold">{{ $t('forum.voting_summary') }}</div>
          <div class="text-xs text-text-tertiary">{{ $t('forum.voting_total', { count: voteTotal }) }}</div>
        </div>
        <ul class="space-y-2">
          <li v-for="opt in post.poll_options" :key="opt.id">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="truncate">{{ opt.label }}</span>
              <span class="text-text-tertiary tabular-nums">{{ voteCountFor(opt.id) }} · {{ votePercentFor(opt.id) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-bg-overlay overflow-hidden">
              <div class="h-full bg-brand-500" :style="{ width: votePercentFor(opt.id) + '%' }" />
            </div>
          </li>
        </ul>
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
        <div class="flex-1" />
        <UiButton
          v-if="canDelete"
          variant="ghost"
          size="sm"
          class="text-danger"
          @click="deleteOpen = true"
        >
          <template #leading><LucideTrash2 :size="14" /></template>
          {{ $t('actions.delete') }}
        </UiButton>
      </div>

      <UiConfirmModal
        :open="deleteOpen"
        :title="$t('actions.delete')"
        :message="$t('forum.post_delete_confirm')"
        variant="danger"
        :loading="deleting"
        @update:open="deleteOpen = $event"
        @confirm="doDelete"
      />

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
          <div v-if="post.voting_enabled && post.poll_options?.length" class="mt-2 space-y-1">
            <div class="text-sm text-text-tertiary">{{ alreadyVoted ? $t('forum.poll_already_voted') : $t('forum.poll_option_prompt') }}</div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="opt in post.poll_options"
                :key="opt.id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm cursor-pointer transition"
                :class="[
                  selectedOptionId === opt.id ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-border-subtle hover:bg-bg-overlay',
                  alreadyVoted ? 'opacity-50 cursor-not-allowed' : '',
                ]"
              >
                <input
                  v-model="selectedOptionId"
                  type="radio"
                  name="poll-option"
                  :value="opt.id"
                  :disabled="alreadyVoted"
                  class="accent-brand-500"
                >
                <span>{{ opt.label }}</span>
              </label>
              <label
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm cursor-pointer transition"
                :class="selectedOptionId === null ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-border-subtle hover:bg-bg-overlay'"
              >
                <input
                  v-model="selectedOptionId"
                  type="radio"
                  name="poll-option"
                  :value="null"
                  class="accent-brand-500"
                >
                <span>{{ $t('forum.poll_no_vote') }}</span>
              </label>
            </div>
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
              <UiTag v-if="post.voting_enabled && c.poll_option_id != null" size="sm" variant="info">
                {{ $t('forum.poll_voted_badge', { label: optionLabel(c.poll_option_id) || '' }) }}
              </UiTag>
              <div class="flex-1" />
              <button
                v-if="canDeleteComment(c)"
                type="button"
                class="text-xs text-text-tertiary hover:text-danger inline-flex items-center gap-1"
                :title="$t('actions.delete')"
                @click="askDeleteComment(c.id)"
              >
                <LucideTrash2 :size="13" />
              </button>
            </div>
            <div class="text-text-primary text-sm whitespace-pre-wrap break-words">{{ c.content }}</div>
          </li>
        </ul>

        <UiConfirmModal
          :open="commentDeleteOpen"
          :title="$t('actions.delete')"
          :message="$t('forum.comment_delete_confirm')"
          variant="danger"
          :loading="commentDeleting"
          @update:open="commentDeleteOpen = $event"
          @confirm="doDeleteComment"
        />
      </section>
    </template>

    <div v-else-if="error">
      <UiEmpty :message="$t('errors.POST_NOT_FOUND')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { formatDate } from '~/utils/format'
import type { PostDetail, CommentItem } from '~/types/api'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const router = useRouter()
const id = computed(() => String(route.params.id))
const commentDraft = ref('')
const selectedOptionId = ref<number | null>(null)
const commentSubmitting = ref(false)
const likeBusy = ref(false)
const liked = ref(false)
const likeCount = ref(0)
const deleteOpen = ref(false)
const deleting = ref(false)
const commentDeleteOpen = ref(false)
const commentDeleting = ref(false)
const commentDeleteId = ref<number | null>(null)

const { data: post, error, refresh: refreshPost } = await useAsyncData(
  () => `post.${id.value}`,
  () => useApi<PostDetail>(`/api/posts/${id.value}`),
)

watch(post, (p) => {
  if (!p) return
  liked.value = p.liked
  likeCount.value = p.like_count
}, { immediate: true })

// SSR fetches anonymously, so viewer-specific fields like `liked` come back
// as false. Refresh once on the client so logged-in users see their state.
onMounted(() => {
  if (auth.isLoggedIn) refreshPost()
})
watch(() => auth.isLoggedIn, (v) => { if (v) refreshPost() })

useHead(() => ({ title: post.value?.title || 'Post' }))

const { data: comments, pending: pendingComments, refresh: refreshComments } = await useAsyncData(
  () => `post.comments.${id.value}`,
  () => useApi<{ items: CommentItem[], total: number }>(`/api/posts/${id.value}/comments?page=1&size=50`),
)

const voteTotal = computed(() => post.value?.voting_summary?.total ?? 0)

function voteCountFor(optionId: number): number {
  const c = post.value?.voting_summary?.counts.find((x) => x.option_id === optionId)
  return c?.count ?? 0
}

function votePercentFor(optionId: number): number {
  const total = voteTotal.value
  if (!total) return 0
  return Math.round((voteCountFor(optionId) / total) * 100)
}

const optionLabelMap = computed(() => {
  const m = new Map<number, string>()
  for (const o of post.value?.poll_options ?? []) m.set(o.id, o.label)
  return m
})

function optionLabel(id: number): string | undefined {
  return optionLabelMap.value.get(id)
}

// True when the current viewer already has a vote-bearing comment on this
// post — derived from the comment list so we don't need a separate endpoint.
const alreadyVoted = computed(() => {
  const me = auth.user?.id
  if (!me) return false
  return (comments.value?.items ?? []).some((c) => c.author.id === me && c.poll_option_id != null)
})

// Clear a stale option selection if the user has already voted (e.g. after
// posting a vote in this session).
watch(alreadyVoted, (v) => { if (v) selectedOptionId.value = null })

async function submitComment() {
  if (!commentDraft.value.trim()) return
  commentSubmitting.value = true
  try {
    const body: Record<string, unknown> = { content: commentDraft.value }
    if (post.value?.voting_enabled && selectedOptionId.value != null) {
      body.poll_option_id = selectedOptionId.value
    }
    await useApi(`/api/posts/${id.value}/comments`, { method: 'POST', body })
    commentDraft.value = ''
    selectedOptionId.value = null
    toast.success(t('forum.comment_created'))
    // Refresh both: comments to show the new entry, post to refresh voting_summary.
    await Promise.all([refreshComments(), refreshPost()])
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

const canDelete = computed(() => {
  const p = post.value
  if (!p || !auth.isLoggedIn) return false
  return auth.user?.id === p.author.id || auth.isMod
})

function canDeleteComment(c: CommentItem): boolean {
  if (!auth.isLoggedIn) return false
  return auth.user?.id === c.author.id || auth.isMod
}

function askDeleteComment(commentId: number) {
  commentDeleteId.value = commentId
  commentDeleteOpen.value = true
}

async function doDeleteComment() {
  const cid = commentDeleteId.value
  if (cid == null) return
  commentDeleting.value = true
  try {
    await useApi(`/api/comments/${cid}`, { method: 'DELETE' })
    toast.success(t('forum.comment_deleted'))
    commentDeleteOpen.value = false
    commentDeleteId.value = null
    await Promise.all([refreshComments(), refreshPost()])
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    commentDeleting.value = false
  }
}

async function doDelete() {
  if (!post.value) return
  deleting.value = true
  try {
    await useApi(`/api/posts/${id.value}`, { method: 'DELETE' })
    toast.success(t('forum.post_deleted'))
    deleteOpen.value = false
    router.push(`/forums/${post.value.forum.slug}`)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    deleting.value = false
  }
}
</script>
