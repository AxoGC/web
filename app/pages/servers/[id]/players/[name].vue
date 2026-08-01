<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <NuxtLink
      :to="`/servers/${id}`"
      class="md:hidden inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
    >
      <LucideChevronLeft :size="16" />
      {{ $t('actions.back') }}
    </NuxtLink>

    <UiCard v-if="server" padded class="mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 p-1 rounded-md bg-bg-overlay overflow-hidden grid place-items-center shrink-0">
          <img
            v-if="serverIconSrc && !serverIconBroken"
            :src="serverIconSrc"
            :alt="server.name"
            class="w-full h-full object-cover"
            @error="serverIconBroken = true"
          >
          <LucideServer v-else :size="18" class="text-text-tertiary" />
        </div>
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="`/servers/${id}`"
            class="hover:text-brand-400 inline-flex items-center gap-1"
          >
            <span>{{ server.name }}</span>
            <LucideExternalLink :size="14" class="text-text-tertiary" />
          </NuxtLink>
          <div class="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary">
            <UiTag size="sm">{{ typeLabel(server.type) }}</UiTag>
            <UiStatusDot :status="server.status">
              <span>{{ statusLabel }}</span>
            </UiStatusDot>
            <span v-if="server.status === 'online'">{{ server.online }}/{{ server.max }}</span>
          </div>
        </div>
      </div>
    </UiCard>

    <header class="flex items-center gap-3 mb-6 flex-wrap">
      <UiAvatar :name="name" size="md" />
      <h1 class="text-2xl">{{ name }}</h1>
    </header>

    <UiCard padded>
      <PlayerActivityPanel :server-id="id" :game-name="name" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ServerSummary } from '~/types/api'
import { gameTypeIcon } from '~/composables/useGameTypeIcon'
import { primaryServerType } from '~/composables/useServerTypes'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const { t } = useI18n()
const id = computed(() => String(route.params.id))
const name = computed(() => decodeURIComponent(String(route.params.name)))

const typeLabel = useServerTypeLabel()

const { data: server } = await useAsyncData(
  () => `server.head.${id.value}`,
  () => useApi<ServerSummary>(`/api/servers/${id.value}`).catch(() => null),
)

const serverIconBroken = ref(false)
const serverIconSrc = computed(() => server.value?.icon || gameTypeIcon(primaryServerType(server.value?.type)))
watch(serverIconSrc, () => { serverIconBroken.value = false })

const statusLabel = computed(() => {
  const s = server.value?.status
  return s ? ({
    online: t('common.online'),
    offline: t('common.offline'),
    maintenance: t('common.maintenance'),
  }[s] || s) : ''
})

// This page is only meant for unbound game accounts — clicking a player
// anywhere on the site (usePlayerNavigate) already routes registered players
// straight to their platform profile, but direct/bookmarked links can still
// land here, so redirect server-side too rather than showing a duplicate view.
interface BindingResp { user_id: number }
const { data: binding } = await useAsyncData(
  () => `srv.player.${id.value}.${name.value}.binding`,
  () => useApi<BindingResp>(
    `/api/servers/${id.value}/players/${encodeURIComponent(name.value)}/binding`,
  ).catch(() => null),
)
if (binding.value?.user_id) {
  await navigateTo(`/users/${binding.value.user_id}`, { replace: true })
}

useHead(() => ({ title: name.value }))
</script>
