<template>
  <NuxtLink :to="`/servers/${server.id}`" class="group block">
    <UiCard hoverable padded>
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 rounded-lg bg-bg-overlay shrink-0 overflow-hidden grid place-items-center">
          <img v-if="server.icon" :src="server.icon" :alt="server.name" class="w-full h-full object-cover">
          <LucideServer v-else :size="22" class="text-text-tertiary" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-semibold truncate text-text-primary group-hover:text-brand-400">{{ server.name }}</h3>
            <UiTag size="sm" variant="info">{{ server.type }}</UiTag>
          </div>
          <div class="flex items-center gap-3 text-xs text-text-tertiary">
            <UiStatusDot :status="server.status">
              <span class="text-text-secondary">{{ statusLabel }}</span>
            </UiStatusDot>
            <span v-if="server.status === 'online'">{{ server.online }}/{{ server.max }}</span>
          </div>
          <p class="mt-2 font-mono text-xs text-text-tertiary truncate">{{ server.host }}:{{ server.port }}</p>
        </div>
      </div>
    </UiCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerSummary } from '~/types/api'

const props = defineProps<{ server: ServerSummary }>()
const { t } = useI18n()

const statusLabel = computed(() => {
  return {
    online: t('common.online'),
    offline: t('common.offline'),
    maintenance: t('common.maintenance'),
  }[props.server.status] || props.server.status
})
</script>
