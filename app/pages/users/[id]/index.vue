<template>
  <div>
    <div v-if="error">
      <UiEmpty :message="$t('errors.USER_NOT_FOUND')" />
    </div>
    <div v-else-if="user" class="max-w-2xl mx-auto bg-bg-elevated">
      <!-- Top hero: no rounding, no bounding card — when the user has an
           uploaded background image it fills the whole hero under a flat
           dark overlay (mirrors the forum-banner treatment) and flips text
           to white; otherwise it just inherits the container's background.
           Row 1 (back / more) sits above row 2 (identity + stats), both
           inside the same overlay so the icon buttons stay legible over
           the photo. -->
      <div
        :class="hasBg ? 'bg-cover bg-center' : ''"
        :style="hasBg ? { backgroundImage: `url(${user.background})` } : undefined"
      >
        <div :class="hasBg ? 'bg-black/40 text-white [text-shadow:0_1px_2px_rgb(0_0_0/55%)]' : ''">
          <div class="flex items-center justify-between p-3">
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-gray-800/40 text-white backdrop-blur-sm grid place-items-center hover:bg-gray-800/60 focus:outline-none"
              :aria-label="$t('actions.back')"
              @click="goBack"
            >
              <LucideChevronLeft :size="18" />
            </button>
            <UiDropdown align="end">
              <template #trigger>
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-gray-800/40 text-white backdrop-blur-sm grid place-items-center hover:bg-gray-800/60 focus:outline-none"
                  :aria-label="$t('profile.more_actions')"
                >
                  <LucideEllipsis :size="18" />
                </button>
              </template>
              <UiDropdownItem v-if="isSelf" @select="router.push('/me/settings')">
                <LucideSettings :size="14" /> {{ $t('me.edit_profile') }}
              </UiDropdownItem>
              <UiDropdownItem @select="copyLink">
                <LucideLink :size="14" /> {{ $t('profile.copy_link') }}
              </UiDropdownItem>
            </UiDropdown>
          </div>

          <div class="px-6 pb-6">
            <div class="flex items-start gap-5">
              <UiAvatar :src="user.avatar" :name="user.username" size="xl" clickable />
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-2xl leading-none">{{ user.username }}</h1>
                  <UiTag
                    v-if="user.role && user.role !== 'user'"
                    :variant="user.role === 'admin' ? 'brand' : 'info'"
                    class="text-shadow-none"
                  >
                    {{ user.role }}
                  </UiTag>
                  <FollowButton
                    v-if="!isSelf"
                    :user-id="user.id"
                    :is-following="!!followStats?.is_following"
                    :follower-count="followStats?.follower_count ?? 0"
                    :following-count="followStats?.following_count ?? 0"
                    @change="onFollowChange"
                  />
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
                <p :class="['mt-1 text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">
                  {{ lastLoginLine }}
                </p>
              </div>
            </div>

            <!-- Inline stats strip: follow + presence + likes received.
                 Check-in streak/total were dropped from here (points system
                 already surfaces those); likes-received stays hoisted up from
                 the bottom card so the passive aggregate sits with the other
                 passive stats and the lower card can focus on active output
                 (posts/comments). -->
            <div class="mt-5 grid grid-cols-3 gap-3 text-center">
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
                <div :class="['text-xs', hasBg ? 'text-white/70' : 'text-text-tertiary']">{{ $t('profile.forum_likes') }}</div>
                <div class="mt-1 text-sm font-medium">{{ stats?.forum_likes_received ?? 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rest of the content: a single flex column with its own padding —
           the two sections below no longer carry their own background or
           padding, so the boundary between them reads purely from heading
           weight and spacing rather than a card edge. -->
      <div class="flex flex-col gap-4 p-4">
        <UiCard flat>
          <h2 class="text-lg mb-2">{{ $t('profile.bindings_title') }}</h2>
          <UiEmpty v-if="sortedBindings.length === 0" :message="$t('profile.bindings_empty')" />
          <!-- Two per row on wide screens rather than one wide row each — each
               cell keeps the exact same (mobile) internal layout regardless of
               viewport, so grid-cols-2 is purely a "fit more cards per row"
               change, not a per-cell reflow. -->
          <ul v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li
              v-for="b in visibleBindings"
              :key="b.server_id"
              class="rounded-lg border border-border-subtle p-3"
            >
              <!-- Online/offline duration and "bound at" both moved into
                   PlayerActivityPanel's own tick bar below — this header is
                   now just identity (server + character) and the PK action. -->
              <div class="flex flex-row items-start justify-between gap-2">
                <div class="flex flex-col min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <NuxtLink
                      :to="`/servers/${b.server_id}/players/${encodeURIComponent(b.game_name)}`"
                      class="font-medium hover:text-brand-400 truncate"
                    >
                      {{ b.server_name }}
                    </NuxtLink>
                    <UiTag size="sm">{{ typeLabel(b.server_type) }}</UiTag>
                  </div>
                  <div class="mt-1 text-xs text-text-tertiary truncate">{{ b.game_name }}</div>
                </div>
                <NuxtLink
                  v-if="viewerBindingsByServer[b.server_id] && user"
                  class="shrink-0"
                  :to="pkLink(b)"
                >
                  <UiButton size="sm" variant="primary">
                    {{ $t('pk.cta') }}
                  </UiButton>
                </NuxtLink>
              </div>

              <PlayerActivityPanel class="mt-3" :server-id="b.server_id" :game-name="b.game_name" />
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

        <UiCard flat>
          <div class="flex items-center justify-between mb-2 gap-3">
            <h2 class="text-lg">{{ $t('profile.forum_title') }}</h2>
            <div role="radiogroup" :aria-label="$t('profile.forum_title')" class="flex items-center gap-1 text-sm shrink-0">
              <label
                v-for="tab in activityTabs"
                :key="tab.value"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition"
                :class="activityTab === tab.value
                  ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                  : 'border-border-subtle hover:bg-bg-overlay text-text-secondary'"
              >
                <input
                  v-model="activityTab"
                  type="radio"
                  name="profile-activity-tab"
                  :value="tab.value"
                  class="accent-brand-500"
                >
                <span>{{ tab.label }}</span>
              </label>
            </div>
          </div>
          <div class="mt-4">
            <div v-show="activityTab === 'posts'">
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
            </div>
            <div v-show="activityTab === 'comments'">
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
            </div>
          </div>
        </UiCard>
      </div>
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
  PublicUser,
  UserBinding,
  UserProfileStats,
  UserRecentComment,
  UserRecentPost,
} from '~/types/api'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const toast = useToast()
const id = computed(() => String(route.params.id))

const goBack = useGoBack()

async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href)
    toast.success(t('actions.copied'))
  } catch { /* ignore */ }
}

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

const typeLabel = useServerTypeLabel()

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
  if (!ts) return ''
  const r = relativeTime(ts, now.value)
  if (r.kind === 'just_now') return t('common.just_now')
  if (r.kind === 'minutes_ago') return t('common.minutes_ago', { n: r.n })
  if (r.kind === 'hours_ago') return t('common.hours_ago', { n: r.n })
  if (r.kind === 'days_ago') return t('common.days_ago', { n: r.n })
  return r.date ?? ''
})
// Full display line: "Never signed in" reads as its own sentence, not as a
// {time} filling into "Last seen ___" (that combination reads redundant).
const lastLoginLine = computed(() => user.value?.last_login_at
  ? t('profile.last_login', { time: lastLoginText.value })
  : t('profile.last_login_never'))

useHead(() => ({ title: user.value?.username || 'User' }))
</script>
