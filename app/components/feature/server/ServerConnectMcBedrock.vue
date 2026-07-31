<template>
  <div v-if="endpoints.length" class="space-y-1.5">
    <!-- Address + port + one-click join all on one line. No copy buttons here —
         two separate copy targets (address, port) made this fiddly to copy;
         the deep link is the one real way players add a Bedrock server anyway. -->
    <div
      v-for="(ep, i) in endpoints"
      :key="i"
      class="flex items-center gap-2 text-sm flex-wrap"
    >
      <span v-if="ep.label" class="text-xs text-text-tertiary shrink-0">{{ ep.label }}</span>
      <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.bedrock_address') }}</span>
      <span class="font-mono text-xs text-text-tertiary truncate">{{ ep.host }}</span>
      <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.bedrock_port') }}</span>
      <span class="font-mono text-xs text-text-tertiary shrink-0">{{ portOf(ep) }}</span>
      <a
        :href="deepLink(ep)"
        class="inline-flex items-center gap-1 text-xs text-brand-400 hover:underline shrink-0"
        :title="$t('server.bedrock_deeplink_hint')"
      >
        <LucideExternalLink :size="12" /> {{ $t('server.bedrock_add_to_game') }}
      </a>
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
function portOf(ep: ServerEndpoint) {
  return ep.port ?? defaultPortFor('mc-bedrock')!
}

// Bedrock client URI handler (Win10 / iOS / Android, since 1.14). Format:
//   minecraft://?addExternalServer=<DisplayName>|<host>:<port>
// The display name surfaces inside the "External servers" list — we use the
// server's public name plus the endpoint label so admins can differentiate
// CN/海外 entries. URI-encode the params so `|`, `:`, CJK, spaces survive
// transit; the client decodes before showing the confirm dialog.
function deepLink(ep: ServerEndpoint) {
  const display = ep.label ? `${props.server.name} · ${ep.label}` : props.server.name
  const payload = `${display}|${ep.host}:${portOf(ep)}`
  return `minecraft://?addExternalServer=${encodeURIComponent(payload)}`
}
</script>
