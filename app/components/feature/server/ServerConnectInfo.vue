<template>
  <component :is="variant" :server="server" />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { ServerDetail } from '~/types/api'
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

const variant = computed<Component>(() => VARIANTS[props.server.type] || ServerConnectGeneric)
</script>
