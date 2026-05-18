<template>
  <div v-if="endpoints.length" class="space-y-3">
    <!-- Bedrock's client UI separates address and port into two distinct rows; mirror that. -->
    <div v-for="(ep, i) in endpoints" :key="i" class="space-y-1.5">
      <p v-if="ep.label" class="text-xs text-text-tertiary">{{ ep.label }}</p>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-xs text-text-tertiary w-12 shrink-0">{{ $t('server.bedrock_address') }}</span>
        <span class="font-mono text-xs text-text-tertiary truncate">{{ ep.host }}</span>
        <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1" @click="conn.copy(ep.host)">
          <LucideCopy :size="12" /> {{ $t('actions.copy') }}
        </button>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-xs text-text-tertiary w-12 shrink-0">{{ $t('server.bedrock_port') }}</span>
        <span class="font-mono text-xs text-text-tertiary">{{ portOf(ep) }}</span>
        <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1" @click="conn.copy(String(portOf(ep)))">
          <LucideCopy :size="12" /> {{ $t('actions.copy') }}
        </button>
      </div>
      <a
        :href="deepLink(ep)"
        class="inline-flex items-center gap-1 text-xs text-brand-400 hover:underline"
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
