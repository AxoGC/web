<template>
  <!-- Address + port + one-click join all on one line. No copy buttons here —
       two separate copy targets (address, port) made this fiddly to copy;
       the deep link is the one real way players add a Bedrock server anyway. -->
  <div class="flex items-center gap-2 text-sm flex-wrap">
    <span v-if="method.label" class="text-xs text-text-tertiary shrink-0">{{ method.label }}</span>
    <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.bedrock_address') }}</span>
    <span class="font-mono text-xs text-text-tertiary truncate">{{ method.host }}</span>
    <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.bedrock_port') }}</span>
    <span class="font-mono text-xs text-text-tertiary shrink-0">{{ method.port }}</span>
    <a
      :href="deepLink"
      class="inline-flex items-center gap-1 text-xs text-brand-400 hover:underline shrink-0"
      :title="$t('server.bedrock_deeplink_hint')"
    >
      <LucideExternalLink :size="12" /> {{ $t('server.bedrock_add_to_game') }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { McbeJoinMethod } from '~/types/api'
import { buildMcbeDeepLink } from '~/composables/useServerConnect'

const props = defineProps<{ method: McbeJoinMethod, serverName: string }>()
// Computed at render time rather than stored: it's fully derived from
// host/port/label/server-name, so persisting it risks going stale if the
// server's display name changes without the connect form being re-saved.
const deepLink = computed(() => buildMcbeDeepLink(props.serverName, props.method.host, props.method.port, props.method.label))
</script>
