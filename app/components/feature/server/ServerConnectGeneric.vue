<template>
  <div v-if="endpoints.length" class="space-y-1.5">
    <div
      v-for="(ep, i) in endpoints"
      :key="i"
      class="flex items-center gap-2 text-sm"
    >
      <span v-if="ep.label" class="text-xs text-text-tertiary shrink-0">{{ ep.label }}</span>
      <span class="font-mono text-xs text-text-tertiary truncate">{{ raw(ep) }}</span>
      <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0" @click="conn.copy(raw(ep))">
        <LucideCopy :size="12" /> {{ $t('actions.copy') }}
      </button>
    </div>
  </div>
  <div v-else class="text-xs text-text-tertiary">{{ $t('server.connect_missing') }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerDetail, ServerEndpoint } from '~/types/api'

const props = defineProps<{ server: ServerDetail }>()
const conn = useServerConnect(() => props.server)
const endpoints = computed(() => conn.extractEndpoints(props.server))
function raw(ep: ServerEndpoint) {
  return ep.port ? `${ep.host}:${ep.port}` : ep.host
}
</script>
