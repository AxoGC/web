<template>
  <div>
    <div v-if="error">
      <UiEmpty :message="$t('errors.USER_NOT_FOUND')" />
    </div>
    <div v-else-if="user" class="max-w-2xl mx-auto flex flex-col gap-5">
      <UiCard padded>
        <div class="flex items-start gap-5">
          <UiAvatar :src="user.avatar" :name="user.username" size="xl" />
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
          <NuxtLink v-if="isSelf" to="/me/settings" class="shrink-0">
            <UiButton size="sm" variant="secondary">{{ $t('me.edit_profile') }}</UiButton>
          </NuxtLink>
        </div>
      </UiCard>

      <UiCard padded>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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
            class="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <NuxtLink
                  :to="`/servers/${b.server_id}`"
                  class="font-medium hover:text-brand-400 truncate"
                >
                  {{ b.server_name }}
                </NuxtLink>
                <UiTag size="sm">{{ b.server_type }}</UiTag>
              </div>
              <div class="mt-1 text-xs text-text-tertiary">
                {{ b.game_name }}
                <span class="mx-1">·</span>
                {{ $t('profile.bindings_playtime', { value: formatDuration(b.play_time_seconds) }) }}
              </div>
            </div>
            <div v-if="b.bound_at" class="text-xs text-text-tertiary shrink-0">
              {{ $t('profile.bindings_bound_at', { date: formatDate(b.bound_at) }) }}
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
import { computed } from 'vue'
import { formatDate, formatDuration, relativeTime } from '~/utils/format'
import { useAuthStore } from '~/stores/auth'
import type { PublicUser, UserBinding, UserProfileStats } from '~/types/api'

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

const { data: stats } = await useAsyncData(
  () => `user.${id.value}.stats`,
  () => useApi<UserProfileStats>(`/api/users/${id.value}/profile-stats`).catch(() => null),
)

const isSelf = computed(() => !!auth.user && auth.user.id === user.value?.id)

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
