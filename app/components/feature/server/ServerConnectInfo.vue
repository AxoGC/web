<template>
  <div v-if="methods.length" class="space-y-2">
    <component :is="COMPONENTS[m.type]" v-for="(m, i) in methods" :key="i" :method="m" :server-name="server.name" />
  </div>
  <div v-else class="text-xs text-text-tertiary">{{ $t('server.connect_missing') }}</div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { ServerDetail, ServerJoinMethod } from '~/types/api'
import { extractJoinMethods } from '~/composables/useServerConnect'
import ServerJoinMethodMcje from './join-methods/ServerJoinMethodMcje.vue'
import ServerJoinMethodMcbe from './join-methods/ServerJoinMethodMcbe.vue'
import ServerJoinMethodDst from './join-methods/ServerJoinMethodDst.vue'
import ServerJoinMethodTerraria from './join-methods/ServerJoinMethodTerraria.vue'
import ServerJoinMethodSv from './join-methods/ServerJoinMethodSv.vue'

const props = defineProps<{ server: ServerDetail }>()

// One component per join-method discriminant. Each server just lists its
// join_methods[] — rendering is a single loop keyed off each entry's own
// `type`, independent of server.type, so there's exactly one source of
// truth per row (no more per-server-type filtering/duplication).
const COMPONENTS: Record<ServerJoinMethod['type'], Component> = {
  mcje: ServerJoinMethodMcje,
  mcbe: ServerJoinMethodMcbe,
  dst: ServerJoinMethodDst,
  terraria: ServerJoinMethodTerraria,
  sv: ServerJoinMethodSv,
}

const methods = computed(() => extractJoinMethods(props.server))
</script>
