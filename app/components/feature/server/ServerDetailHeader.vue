<template>
  <header class="flex flex-wrap items-start gap-4 mb-6">
    <div class="w-16 h-16 rounded-lg bg-bg-overlay overflow-hidden grid place-items-center shrink-0">
      <img v-if="server.icon" :src="server.icon" :alt="server.name" class="w-full h-full object-cover">
      <LucideServer v-else :size="28" class="text-text-tertiary" />
    </div>
    <div class="flex-1 min-w-0">
      <h1 class="text-2xl font-bold flex flex-wrap items-center gap-2">
        <span>{{ server.name }}</span>
        <UiTag variant="info">{{ server.type }}</UiTag>
      </h1>
      <p v-if="server.description" class="text-text-secondary mt-1">{{ server.description }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <UiStatusDot :status="server.status">
          <span class="font-medium">{{ statusLabel }}</span>
        </UiStatusDot>
        <span v-if="server.status === 'online'" class="text-text-secondary">
          {{ server.online }}/{{ server.max }}
        </span>
      </div>
      <div class="mt-3">
        <ServerConnectInfo :server="server" />
      </div>
    </div>
    <div v-if="auth.isLoggedIn" class="shrink-0">
      <NuxtLink :to="`/me/bindings?server=${server.id}`">
        <UiButton variant="secondary" size="sm">
          <template #leading><LucideLink :size="14" /></template>
          {{ $t('server.bind_title') }}
        </UiButton>
      </NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerDetail } from '~/types/api'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ server: ServerDetail }>()
const { t } = useI18n()
const auth = useAuthStore()

const statusLabel = computed(() => ({
  online: t('common.online'),
  offline: t('common.offline'),
  maintenance: t('common.maintenance'),
}[props.server.status] || props.server.status))
</script>
