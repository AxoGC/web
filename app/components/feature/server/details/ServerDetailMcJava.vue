<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <ServerDescriptionConnectRow :server="server" />
    <ServerOnlineTrendCard class="lg:col-span-2" :server-id="server.id" />
    <ServerOnlinePlayersCard :server-id="server.id" :type="server.type" :players="server.players" :max="server.max" />
    <ServerChatPanel class="lg:col-span-2" :server-id="server.id" />
    <ServerLeaderboardSummary :server-id="server.id" />
    <ServerBluemapPanel class="lg:col-span-3" :server="server" />
  </div>
</template>

<script setup lang="ts">
import type { ServerDetail } from '~/types/api'
defineProps<{ server: ServerDetail }>()
</script>
