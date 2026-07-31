<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <ServerOverviewRow :server="server" />
    <ServerOnlineTrendCard class="lg:col-span-2" :server-id="server.id" />
    <UiCard padded>
      <h2 class="text-lg mb-4">{{ $t('server.dst_world_info') }}</h2>
      <dl class="space-y-2 text-sm">
        <div v-if="meta.game_mode" class="flex justify-between gap-3">
          <dt class="text-text-tertiary">{{ $t('server.dst_game_mode') }}</dt>
          <dd>{{ meta.game_mode }}</dd>
        </div>
        <div v-if="meta.season" class="flex justify-between gap-3">
          <dt class="text-text-tertiary">{{ $t('server.dst_season') }}</dt>
          <dd>{{ meta.season }}</dd>
        </div>
        <div v-if="meta.mods?.length" class="space-y-1">
          <dt class="text-text-tertiary">{{ $t('server.dst_mods') }}</dt>
          <dd class="flex flex-wrap gap-1">
            <UiTag v-for="m in meta.mods" :key="m" size="sm">{{ m }}</UiTag>
          </dd>
        </div>
      </dl>
    </UiCard>
    <ServerChatPanel class="lg:col-span-3" :server-id="server.id" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DstMeta, ServerDetail } from '~/types/api'

const props = defineProps<{ server: ServerDetail }>()
const meta = computed(() => (props.server.meta || {}) as DstMeta)
</script>
