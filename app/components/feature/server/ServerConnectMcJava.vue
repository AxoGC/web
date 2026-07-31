<template>
  <div v-if="endpoints.length" class="space-y-1.5">
    <div
      v-for="(ep, i) in endpoints"
      :key="i"
      class="flex items-center gap-2 text-sm"
    >
      <span v-if="ep.label" class="text-xs text-text-tertiary shrink-0">{{ ep.label }}</span>
      <span class="font-mono text-xs text-text-tertiary truncate">{{ display(ep) }}</span>
      <button
        class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0"
        @click="conn.copy(display(ep))"
      >
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
// Endpoints tagged for another client (e.g. mc-bedrock on a multi-type
// server) belong to that card instead — only untagged/mc-java ones are ours.
const endpoints = computed(() => conn.extractEndpoints(props.server).filter(e => !e.type || e.type === 'mc-java'))
// Hardcode 'mc-java' rather than props.server.type: this card can be shown
// alongside other connect cards on a multi-type server, and the
// port-omission default must always be Java's regardless.
function display(ep: ServerEndpoint) {
  return conn.formatEndpoint('mc-java', ep)
}
</script>
