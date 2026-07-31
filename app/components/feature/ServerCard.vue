<template>
  <!-- h-full on the link + card so a grid row's tallest card pulls its
       siblings up to the same height. Without this, a card with a connect
       hint line is taller than one without and the row looks ragged. -->
  <NuxtLink :to="`/servers/${server.id}`" class="group block h-full">
    <UiCard hoverable padded class="h-full">
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 p-1.5 rounded-lg bg-bg-overlay shrink-0 overflow-hidden grid place-items-center">
          <img
            v-if="iconSrc && !iconBroken"
            :src="iconSrc"
            :alt="server.name"
            class="w-full h-full object-cover"
            @error="iconBroken = true"
          >
          <LucideServer v-else :size="22" class="text-text-tertiary" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="truncate text-text-primary group-hover:text-brand-400">{{ server.name }}</h3>
            <UiTag size="sm" variant="info">{{ typeLabel(server.type) }}</UiTag>
          </div>
          <div class="flex items-center gap-3 text-xs text-text-tertiary">
            <UiStatusDot :status="server.status">
              <span class="text-text-secondary">{{ statusLabel }}</span>
            </UiStatusDot>
            <span v-if="server.status === 'online'">{{ server.online }}/{{ server.max }}</span>
          </div>
          <p v-if="connectHint" class="mt-2 font-mono text-xs text-text-tertiary truncate">{{ connectHint }}</p>
        </div>
      </div>
    </UiCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DstMeta, ServerSummary } from '~/types/api'
import { extractEndpoints, formatEndpoint } from '~/composables/useServerConnect'
import { gameTypeIcon } from '~/composables/useGameTypeIcon'

const props = defineProps<{ server: ServerSummary }>()
const { t } = useI18n()
const typeLabel = useServerTypeLabel()

const iconBroken = ref(false)
const iconSrc = computed(() => props.server.icon || gameTypeIcon(props.server.type))
// Reset the broken flag if the icon source changes (e.g. server.icon gets uploaded
// after the page rendered with the game-type fallback that didn't exist on disk).
watch(iconSrc, () => { iconBroken.value = false })

const statusLabel = computed(() => {
  return {
    online: t('common.online'),
    offline: t('common.offline'),
    maintenance: t('common.maintenance'),
  }[props.server.status] || props.server.status
})

// One-line connect hint for the list view. DST has no host:port so show its search name.
const connectHint = computed(() => {
  if (props.server.type === 'dst') {
    const name = (props.server.meta as DstMeta | undefined)?.find_by_name
    return name ? t('server.dst_search_name_short', { name }) : ''
  }
  const eps = extractEndpoints(props.server)
  return eps.length ? formatEndpoint(props.server.type, eps[0]!) : ''
})
</script>
