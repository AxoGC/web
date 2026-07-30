<template>
  <div>
    <div v-if="error">
      <UiEmpty :message="$t('errors.USER_NOT_FOUND')" />
    </div>
    <div v-else-if="user" class="max-w-2xl mx-auto flex flex-col gap-5">
      <!-- Top card: when the user has uploaded a background image we render
           it underneath a uniform dark overlay (no gradient, mirrors the
           forum-banner cards) and flip the text colours. Otherwise we
           keep the plain themed card. The inverted variant is a single
           branch on `hasBg` rather than two duplicated <UiCard>s. -->
      <UiCard
        :padded="!hasBg"
        :class="hasBg ? 'bg-cover bg-center overflow-hidden' : ''"
        :style="hasBg ? { backgroundImage: `url(${user.background})` } : undefined"
      >
        <div
          :class="hasBg
            ? 'bg-black/40 p-6 text-white [text-shadow:0_1px_2px_rgb(0_0_0/55%)]'
            : ''"
        >
          <div class="flex items-start gap-5">
            <UiAvatar :src="user.avatar" :name="user.username" size="xl" clickable />
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-bold leading-none">{{ user.username }}</h1>
                <UiTag
                  v-if="user.role && user.role !== 'user'"
                  :variant="user.role === 'admin' ? 'brand' : 'info'"
                  class="text-shadow-none"
                >
                  {{ user.role }}
                </UiTag>
              </div>
              <p
                v-if="user.bio"
                :class="['mt-2 text-sm wrap-break-word', hasBg ? 'text-white/85' : 'text-text-secondary']"
              >
                {{ user.bio }}
              </p>
              <p :class="['mt-2 text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">
                {{ $t('profile.joined_at', { date: formatDate(user.created_at) }) }}
              </p>
            </div>
            <div class="shrink-0 flex flex-col items-end gap-2">
              <NuxtLink v-if="isSelf" to="/me/settings">
                <UiButton size="sm" variant="secondary">{{ $t('me.edit_profile') }}</UiButton>
              </NuxtLink>
              <FollowButton
                v-else
                :user-id="user.id"
                :is-following="!!followStats?.is_following"
                :follower-count="followStats?.follower_count ?? 0"
                :following-count="followStats?.following_count ?? 0"
                @change="onFollowChange"
              />
            </div>
          </div>

          <!-- Inline stats strip. Six cells: follow + presence + check-in + likes
               received. Likes-received was hoisted up from the bottom card so the
               passive aggregate sits with the other passive stats and the lower
               card can focus on active output (posts/comments). -->
          <div
            :class="[
              'mt-5 pt-4 grid grid-cols-2 sm:grid-cols-6 gap-3 text-center border-t',
              hasBg ? 'border-white/15' : 'border-border-subtle',
            ]"
          >
            <NuxtLink
              :to="`/users/${user.id}/followers`"
              :class="['rounded-md py-1 transition-colors', hasBg ? 'hover:bg-white/10' : 'hover:bg-bg-hover']"
            >
              <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.followers') }}</div>
              <div class="mt-1 text-sm font-medium">{{ followStats?.follower_count ?? 0 }}</div>
            </NuxtLink>
            <NuxtLink
              :to="`/users/${user.id}/following`"
              :class="['rounded-md py-1 transition-colors', hasBg ? 'hover:bg-white/10' : 'hover:bg-bg-hover']"
            >
              <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.following') }}</div>
              <div class="mt-1 text-sm font-medium">{{ followStats?.following_count ?? 0 }}</div>
            </NuxtLink>
            <div>
              <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.last_login') }}</div>
              <div class="mt-1 text-sm font-medium">{{ lastLoginText }}</div>
            </div>
            <div>
              <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.checkin_streak') }}</div>
              <div class="mt-1 text-sm font-medium">
                {{ $t('profile.checkin_streak_value', { n: stats?.checkin_streak ?? 0 }) }}
              </div>
            </div>
            <div>
              <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.checkin_total') }}</div>
              <div class="mt-1 text-sm font-medium">
                {{ $t('profile.checkin_total_value', { n: stats?.checkin_total ?? 0 }) }}
              </div>
            </div>
            <div>
              <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.forum_likes') }}</div>
              <div class="mt-1 text-sm font-medium">{{ stats?.forum_likes_received ?? 0 }}</div>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard padded>
        <h2 class="text-lg font-semibold mb-3">{{ $t('profile.bindings_title') }}</h2>
        <UiEmpty v-if="sortedBindings.length === 0" :message="$t('profile.bindings_empty')" />
        <ul v-else class="divide-y divide-border-subtle">
          <li
            v-for="b in visibleBindings"
            :key="b.server_id"
            class="py-3"
          >
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    :to="`/servers/${b.server_id}/players/${encodeURIComponent(b.game_name)}`"
                    class="font-medium hover:text-brand-400 truncate"
                  >
                    {{ b.server_name }}
                  </NuxtLink>
                  <UiTag size="sm">{{ typeLabel(b.server_type) }}</UiTag>
                </div>
                <div class="mt-1 text-xs text-text-tertiary flex items-center gap-2 flex-wrap">
                  <span>{{ b.game_name }}</span>
                  <span
                    :class="[
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
                      b.is_online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-bg-overlay text-text-tertiary',
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block w-1.5 h-1.5 rounded-full',
                        b.is_online ? 'bg-emerald-400' : 'bg-text-tertiary',
                      ]"
                    />
                    {{ presence({ isOnline: b.is_online, joinedAt: b.joined_at, lastSeenAt: b.last_seen_at }) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <NuxtLink
                  v-if="viewerBindingsByServer[b.server_id] && user"
                  :to="pkLink(b)"
                >
                  <UiButton size="sm" variant="primary">
                    {{ $t('pk.cta') }}
                  </UiButton>
                </NuxtLink>
                <div v-if="b.bound_at" class="text-xs text-text-tertiary">
                  {{ $t('profile.bindings_bound_at', { date: formatDate(b.bound_at) }) }}
                </div>
              </div>
            </div>

            <div
              v-if="bindingStats[bindingKey(b)]?.length"
              class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              <div
                v-for="axis in bindingStats[bindingKey(b)]"
                :key="axis.key"
                class="bg-bg-overlay/40 rounded px-2.5 py-1.5"
              >
                <p class="text-[10px] text-text-tertiary uppercase tracking-wide">
                  {{ metrics.labelFor(b.server_id, axis.key) }}
                </p>
                <p class="text-sm font-medium text-text-primary">
                  {{ metrics.formatScore(b.server_id, axis.key, axis.value) }}
                </p>
              </div>
            </div>
          </li>
        </ul>
        <!-- Collapse-by-default: long binding lists crowd the profile card,
             so we show the top 2 (sorted by most-recent presence activity)
             and offer an in-place expand for the rest. -->
        <div
          v-if="sortedBindings.length > BINDINGS_PREVIEW"
          class="mt-3 flex justify-center"
        >
          <UiButton variant="ghost" size="sm" @click="bindingsExpanded = !bindingsExpanded">
            {{ bindingsExpanded
              ? $t('profile.bindings_collapse')
              : $t('profile.bindings_show_all', { n: sortedBindings.length }) }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard padded>
        <h2 class="text-lg font-semibold mb-3">{{ $t('profile.forum_title') }}</h2>
        <UiTabs v-model="activityTab" :tabs="activityTabs">
          <UiTabPanel value="posts">
            <UiEmpty v-if="!recentPosts.length" :message="$t('profile.forum_empty_posts')" />
            <ul v-else class="divide-y divide-border-subtle">
              <li v-for="p in recentPosts" :key="p.id" class="py-2.5">
                <NuxtLink :to="`/posts/${p.id}`" class="block group">
                  <div class="font-medium text-text-primary group-hover:text-brand-400 truncate">{{ p.title }}</div>
                  <div class="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
                    <span>{{ formatDate(p.created_at) }}</span>
                    <span class="inline-flex items-center gap-1"><LucideMessageCircle :size="12" />{{ p.comment_count }}</span>
                    <span class="inline-flex items-center gap-1"><LucideEye :size="12" />{{ p.view_count }}</span>
                    <span class="inline-flex items-center gap-1"><LucideHeart :size="12" />{{ p.like_count }}</span>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </UiTabPanel>
          <UiTabPanel value="comments">
            <UiEmpty v-if="!recentComments.length" :message="$t('profile.forum_empty_comments')" />
            <ul v-else class="divide-y divide-border-subtle">
              <li v-for="c in recentComments" :key="c.id" class="py-2.5">
                <NuxtLink :to="`/posts/${c.post_id}#comment-${c.id}`" class="block group">
                  <div class="text-xs text-text-tertiary truncate">
                    {{ $t('profile.forum_comment_on') }}
                    <span class="font-medium text-text-secondary group-hover:text-brand-400">{{ c.post_title }}</span>
                  </div>
                  <div class="mt-1 text-sm text-text-primary wrap-break-word">{{ c.content_excerpt }}</div>
                  <div class="mt-1 text-xs text-text-tertiary">{{ formatDate(c.created_at) }}</div>
                </NuxtLink>
              </li>
            </ul>
          </UiTabPanel>
        </UiTabs>
      </UiCard>
    </div>
    <UiSkeleton v-else :height="180" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { formatDate, relativeTime } from '~/utils/format'
import { useAuthStore } from '~/stores/auth'
import type {
  FollowStats,
  PlayerStats,
  PublicUser,
  StatsAxis,
  UserBinding,
  UserProfileStats,
  UserRecentComment,
  UserRecentPost,
} from '~/types/api'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const id = computed(() => String(route.params.id))

const { data: user, error } = await useAsyncData(
  () => `user.${id.value}`,
  () => useApi<PublicUser>(`/api/users/${id.value}`),
)

const { data: bindingsResp } = await useAsyncData(
  () => `user.${id.value}.bindings`,
  () => useApi<{ items: UserBinding[] }>(`/api/users/${id.value}/bindings`).catch(() => ({ items: [] as UserBinding[] })),
)
const bindings = computed<UserBinding[]>(() => bindingsResp.value?.items ?? [])

// Sort by "most recent presence activity": prefer joined_at (currently online)
// over last_seen_at, and rows with neither sink to the bottom. Stable for
// equal keys so the original API order survives.
const sortedBindings = computed<UserBinding[]>(() => {
  const recencyOf = (b: UserBinding) => Math.max(b.joined_at ?? 0, b.last_seen_at ?? 0)
  return [...bindings.value].sort((a, b) => recencyOf(b) - recencyOf(a))
})

const BINDINGS_PREVIEW = 2
const bindingsExpanded = ref(false)
const visibleBindings = computed<UserBinding[]>(() =>
  bindingsExpanded.value ? sortedBindings.value : sortedBindings.value.slice(0, BINDINGS_PREVIEW),
)

const metrics = useMetricsRegistry()
const typeLabel = useServerTypeLabel()
const presence = usePresence()

function bindingKey(b: UserBinding) {
  return `${b.server_id}:${b.game_name}`
}

// One stats fetch per binding; failures (offline server, unknown player) are
// silently dropped — the binding row still renders, just without the inline
// numbers. Each binding's server has its own metric defs (PLAN §10.6), so we
// also prime the metrics registry for each unique server_id in parallel.
const { data: bindingStatsResp } = await useAsyncData(
  () => `user.${id.value}.binding-stats`,
  async () => {
    const items = bindingsResp.value?.items ?? []
    if (!items.length) return {} as Record<string, StatsAxis[]>
    const uniqueServerIds = Array.from(new Set(items.map(b => b.server_id)))
    await Promise.all(uniqueServerIds.map(sid => metrics.loadFor(sid)))
    const results = await Promise.all(items.map(b =>
      useApi<PlayerStats>(`/api/servers/${b.server_id}/players/${encodeURIComponent(b.game_name)}/stats`)
        .then(r => [bindingKey(b), r.stats ?? []] as const)
        .catch(() => [bindingKey(b), [] as StatsAxis[]] as const),
    ))
    return Object.fromEntries(results)
  },
  { watch: [() => bindingsResp.value?.items?.length] },
)
const bindingStats = computed<Record<string, StatsAxis[]>>(() => bindingStatsResp.value ?? {})

// Viewer's own bindings — only fetched when logged in and viewing someone else.
// Used to gate the per-row PK button: PK is only meaningful when both sides
// play the same server.
const { data: viewerBindingsResp } = await useAsyncData(
  () => `viewer.bindings.${auth.user?.id ?? 'anon'}`,
  () => {
    if (!auth.isLoggedIn || !auth.user || String(auth.user.id) === id.value) {
      return Promise.resolve({ items: [] as UserBinding[] })
    }
    return useApi<{ items: UserBinding[] }>(`/api/users/${auth.user.id}/bindings`)
      .catch(() => ({ items: [] as UserBinding[] }))
  },
  { watch: [() => auth.user?.id, id] },
)
const viewerBindingsByServer = computed<Record<number, UserBinding>>(() => {
  const out: Record<number, UserBinding> = {}
  for (const b of viewerBindingsResp.value?.items ?? []) out[b.server_id] = b
  return out
})

function pkLink(target: UserBinding): string {
  const mine = viewerBindingsByServer.value[target.server_id]
  if (!mine || !auth.user || !user.value) return '/pk'
  const q = new URLSearchParams({
    server_id: String(target.server_id),
    a_uid: String(auth.user.id),
    b_uid: String(user.value.id),
    a: mine.game_name,
    b: target.game_name,
  })
  return `/pk?${q.toString()}`
}

const { data: stats } = await useAsyncData(
  () => `user.${id.value}.stats`,
  () => useApi<UserProfileStats>(`/api/users/${id.value}/profile-stats`).catch(() => null),
)

// Recent activity (5 newest posts + 5 newest comments). Fetched alongside the
// page rather than per-tab because the counts already render eagerly in the tab
// labels — the body just needs to switch.
const { data: recentPostsResp } = await useAsyncData(
  () => `user.${id.value}.recent-posts`,
  () => useApi<{ items: UserRecentPost[] }>(`/api/users/${id.value}/posts`).catch(() => ({ items: [] as UserRecentPost[] })),
)
const { data: recentCommentsResp } = await useAsyncData(
  () => `user.${id.value}.recent-comments`,
  () => useApi<{ items: UserRecentComment[] }>(`/api/users/${id.value}/comments`).catch(() => ({ items: [] as UserRecentComment[] })),
)
const recentPosts = computed<UserRecentPost[]>(() => recentPostsResp.value?.items ?? [])
const recentComments = computed<UserRecentComment[]>(() => recentCommentsResp.value?.items ?? [])

const activityTab = ref('posts')
const activityTabs = computed(() => [
  { value: 'posts', label: `${t('profile.forum_posts')} ${stats.value?.forum_post_count ?? 0}` },
  { value: 'comments', label: `${t('profile.forum_comments')} ${stats.value?.forum_comment_count ?? 0}` },
])

const { data: followStats, refresh: refreshFollowStats } = await useAsyncData(
  () => `user.${id.value}.follow-stats`,
  () => useApi<FollowStats>(`/api/users/${id.value}/follow-stats`).catch(() => null),
)

// SSR fetches anonymously so `is_following` is missing; refetch on client once
// auth is hydrated so logged-in viewers see the correct button state.
onMounted(() => {
  if (auth.isLoggedIn) refreshFollowStats()
})
watch(() => auth.isLoggedIn, (v) => { if (v) refreshFollowStats() })

const isSelf = computed(() => !!auth.user && auth.user.id === user.value?.id)
// hasBg gates the inverted-tone branch in the top card. Backend omits the
// `background` field (or sends empty) when no image is uploaded.
const hasBg = computed(() => !!user.value?.background)

function onFollowChange(v: { is_following: boolean; follower_count: number; following_count: number }) {
  // Replace the whole object so reactivity fires even when `is_following`
  // wasn't present in the original (anonymous SSR) payload.
  followStats.value = { ...(followStats.value ?? {}), ...v }
}

const now = useNow()
const lastLoginText = computed(() => {
  const ts = user.value?.last_login_at
  if (!ts) return t('profile.last_login_never')
  const r = relativeTime(ts, now.value)
  if (r.kind === 'just_now') return t('common.just_now')
  if (r.kind === 'minutes_ago') return t('common.minutes_ago', { n: r.n })
  if (r.kind === 'hours_ago') return t('common.hours_ago', { n: r.n })
  if (r.kind === 'days_ago') return t('common.days_ago', { n: r.n })
  return r.date ?? ''
})

useHead(() => ({ title: user.value?.username || 'User' }))
</script>
