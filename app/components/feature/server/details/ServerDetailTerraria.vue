<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <ServerOverviewRow :server="server" />
    <ServerOnlineTrendCard class="lg:col-span-2" :server-id="server.id" />
    <UiCard padded>
      <h2 class="text-lg mb-4">{{ $t('server.terraria_world_info') }}</h2>
      <dl class="space-y-2 text-sm">
        <div v-if="meta.world" class="flex justify-between gap-3">
          <dt class="text-text-tertiary">{{ $t('server.terraria_world') }}</dt>
          <dd>{{ meta.world }}</dd>
        </div>
        <div v-if="meta.difficulty" class="flex justify-between gap-3">
          <dt class="text-text-tertiary">{{ $t('server.terraria_difficulty') }}</dt>
          <dd>{{ meta.difficulty }}</dd>
        </div>
      </dl>
    </UiCard>
    <ServerLeaderboardSummary
      class="lg:col-span-3"
      :server-id="server.id"
    />
    <ServerChatPanel class="lg:col-span-3" :server-id="server.id" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerDetail, TerrariaMeta } from '~/types/api'

const props = defineProps<{ server: ServerDetail }>()
const meta = computed(() => (props.server.meta || {}) as TerrariaMeta)
</script>
