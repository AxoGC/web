<template>
  <div class="flex flex-col lg:flex-row gap-4">
    <div class="flex flex-col gap-4 lg:w-2/3">
      <ServerDescriptionCard :server="server" />
      <ServerOnlineTrendCard :server-id="server.id" />
      <ServerChatPanel :server-id="server.id" />
      <ServerBluemapPanel :server="server" />
    </div>
    <div class="flex flex-col gap-4 lg:w-1/3">
      <ServerConnectCard :server="server" />
      <ServerOnlinePlayersCard :server-id="server.id" :type="server.type" :players="server.players" :max="server.max" />
      <ServerLeaderboardSummary :server-id="server.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServerDetail } from '~/types/api'
defineProps<{ server: ServerDetail }>()
</script>
