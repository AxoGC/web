<template>
  <div>
    <div v-if="error">
      <UiEmpty :message="$t('errors.USER_NOT_FOUND')" />
    </div>
    <div v-else-if="user" class="max-w-2xl mx-auto flex flex-col gap-5">
      <UiCard padded>
        <div class="flex items-start gap-5">
          <UiAvatar :src="user.avatar" :name="user.username" size="xl" clickable />
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-bold leading-none">{{ user.username }}</h1>
              <UiTag
                v-if="user.role && user.role !== 'user'"
                :variant="user.role === 'admin' ? 'brand' : 'info'"
              >
                {{ user.role }}
              </UiTag>
            </div>
            <p v-if="user.bio" class="mt-2 text-text-secondary text-sm break-words">
              {{ user.bio }}
            </p>
            <p class="mt-2 text-xs text-text-tertiary">
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

        <!-- Inline stats strip — moved here from a separate card per profile redesign. -->
        <div class="mt-5 pt-4 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <NuxtLink
            :to="`/users/${user.id}/followers`"
            class="hover:bg-bg-hover rounded-md py-1 transition-colors"
          >
            <div class="text-xs text-text-tertiary">{{ $t('profile.followers') }}</div>
            <div class="mt-1 text-sm font-medium">{{ followStats?.follower_count ?? 0 }}</div>
          </NuxtLink>
          <NuxtLink
            :to="`/users/${user.id}/following`"
            class="hover:bg-bg-hover rounded-md py-1 transition-colors"
          >
            <div class="text-xs text-text-tertiary">{{ $t('profile.following') }}</div>
            <div class="mt-1 text-sm font-medium">{{ followStats?.following_count ?? 0 }}</div>
          </NuxtLink>
          <div>
            <div class="text-xs text-text-tertiary">{{ $t('profile.last_login') }}</div>
            <div class="mt-1 text-sm font-medium">{{ lastLoginText }}</div>
          </div>
          <div>
            <div class="text-xs text-text-tertiary">{{ $t('profile.checkin_streak') }}</div>
            <div class="mt-1 text-sm font-medium">
              {{ $t('profile.checkin_streak_value', { n: stats?.checkin_streak ?? 0 }) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-text-tertiary">{{ $t('profile.checkin_total') }}</div>
            <div class="mt-1 text-sm font-medium">
              {{ $t('profile.checkin_total_value', { n: stats?.checkin_total ?? 0 }) }}
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard padded>
        <h2 class="text-lg font-semibold mb-3">{{ $t('profile.bindings_title') }}</h2>
        <UiEmpty v-if="bindings.length === 0" :message="$t('profile.bindings_empty')" />
        <ul v-else class="divide-y divide-border-subtle">
          <li
            v-for="b in bindings"
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
                <div class="mt-1 text-xs text-text-tertiary">
                  {{ b.game_name }}
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
                  {{ metrics.labelFor(axis.key) }}
                </p>
                <p class="text-sm font-medium text-text-primary">
                  {{ metrics.formatScore(axis.key, axis.value) }}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </UiCard>

      <UiCard padded>
        <h2 class="text-lg font-semibold mb-3">{{ $t('profile.forum_title') }}</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold">{{ stats?.forum_post_count ?? 0 }}</div>
            <div class="text-xs text-text-tertiary mt-1">{{ $t('profile.forum_posts') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats?.forum_comment_count ?? 0 }}</div>
            <div class="text-xs text-text-tertiary mt-1">{{ $t('profile.forum_comments') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats?.forum_likes_received ?? 0 }}</div>
            <div class="text-xs text-text-tertiary mt-1">{{ $t('profile.forum_likes') }}</div>
          </div>
        </div>
      </UiCard>
    </div>
    <UiSkeleton v-else :height="180" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { formatDate, relativeTime } from '~/utils/format'
import { useAuthStore } from '~/stores/auth'
import type { FollowStats, PlayerStats, PublicUser, StatsAxis, UserBinding, UserProfileStats } from '~/types/api'

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

const metrics = useGameMetrics()
const typeLabel = useServerTypeLabel()

function bindingKey(b: UserBinding) {
  return `${b.server_id}:${b.game_name}`
}

// One stats fetch per binding; failures (offline server, unknown player) are
// silently dropped — the binding row still renders, just without the inline
// numbers.
const { data: bindingStatsResp } = await useAsyncData(
  () => `user.${id.value}.binding-stats`,
  async () => {
    const items = bindingsResp.value?.items ?? []
    if (!items.length) return {} as Record<string, StatsAxis[]>
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

function onFollowChange(v: { is_following: boolean; follower_count: number; following_count: number }) {
  // Replace the whole object so reactivity fires even when `is_following`
  // wasn't present in the original (anonymous SSR) payload.
  followStats.value = { ...(followStats.value ?? {}), ...v }
}

const lastLoginText = computed(() => {
  const ts = user.value?.last_login_at
  if (!ts) return t('profile.last_login_never')
  const r = relativeTime(ts)
  if (r.kind === 'just_now') return t('common.just_now')
  if (r.kind === 'minutes_ago') return t('common.minutes_ago', { n: r.n })
  if (r.kind === 'hours_ago') return t('common.hours_ago', { n: r.n })
  if (r.kind === 'days_ago') return t('common.days_ago', { n: r.n })
  return r.date ?? ''
})

useHead(() => ({ title: user.value?.username || 'User' }))
</script>
