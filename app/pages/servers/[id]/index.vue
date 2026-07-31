<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <div v-if="!server && error">
      <UiEmpty :message="$t('errors.SERVER_NOT_FOUND')" />
    </div>
    <template v-else-if="server">
      <ServerDetailHeader :server="server" />
      <component :is="variant" :server="server" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { ServerDetail } from '~/types/api'
import ServerDetailMcJava from '~/components/feature/server/details/ServerDetailMcJava.vue'
import ServerDetailMcBedrock from '~/components/feature/server/details/ServerDetailMcBedrock.vue'
import ServerDetailDst from '~/components/feature/server/details/ServerDetailDst.vue'
import ServerDetailTerraria from '~/components/feature/server/details/ServerDetailTerraria.vue'
import ServerDetailGeneric from '~/components/feature/server/details/ServerDetailGeneric.vue'
import { primaryServerType } from '~/composables/useServerTypes'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: server, error, refresh: refreshServer } = await useAsyncData(
  () => `server.${id.value}`,
  () => useApi<ServerDetail>(`/api/servers/${id.value}`),
)

useHead(() => ({ title: server.value?.name || 'Server' }))

// Static imports — Nuxt's `pathPrefix: false` auto-imports work via template-tag
// transformation, not via Vue's global registry, so `<component :is="'StringName'">`
// (or resolveComponent) silently fails for non-global feature components.
// `mc-be` is a legacy DB value we keep mapping to Bedrock during the rename.
const VARIANTS: Record<string, Component> = {
  'mc-java': ServerDetailMcJava,
  'mc-bedrock': ServerDetailMcBedrock,
  'mc-be': ServerDetailMcBedrock,
  'dst': ServerDetailDst,
  'terraria': ServerDetailTerraria,
}
const variant = computed<Component>(() =>
  (server.value && VARIANTS[primaryServerType(server.value.type)]) || ServerDetailGeneric,
)

if (import.meta.client) {
  usePolling(async () => { await refreshServer() }, { interval: 30_000, immediate: false })
}
</script>
