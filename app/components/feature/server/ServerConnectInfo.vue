<template>
  <div class="space-y-3">
    <component :is="v" v-for="(v, i) in variants" :key="i" :server="server" />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { ServerDetail } from '~/types/api'
import { parseServerTypes } from '~/composables/useServerTypes'
import ServerConnectMcJava from './ServerConnectMcJava.vue'
import ServerConnectMcBedrock from './ServerConnectMcBedrock.vue'
import ServerConnectDst from './ServerConnectDst.vue'
import ServerConnectTerraria from './ServerConnectTerraria.vue'
import ServerConnectGeneric from './ServerConnectGeneric.vue'

const props = defineProps<{ server: ServerDetail }>()

// Static imports — see comment in pages/servers/[id]/index.vue. `mc-be` is the
// legacy DB value kept here as an alias during the rename to `mc-bedrock`.
const VARIANTS: Record<string, Component> = {
  'mc-java': ServerConnectMcJava,
  'mc-bedrock': ServerConnectMcBedrock,
  'mc-be': ServerConnectMcBedrock,
  'dst': ServerConnectDst,
  'terraria': ServerConnectTerraria,
}

// server.type may list more than one client type (e.g. a mc-java server
// that's also reachable by mc-bedrock clients) — render one connect card
// per type instead of picking a single variant.
const variants = computed<Component[]>(() => {
  const types = parseServerTypes(props.server.type)
  const picked = types.map(t => VARIANTS[t] || ServerConnectGeneric)
  return picked.length ? [...new Set(picked)] : [ServerConnectGeneric]
})
</script>
