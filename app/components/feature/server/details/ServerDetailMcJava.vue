<template>
  <div class="flex flex-col gap-4 lg:flex-row">
    <div class="contents lg:flex lg:flex-col lg:gap-4 lg:w-2/3">
      <ServerDescriptionCard class="order-1 lg:order-none" :server="server" />
      <ServerOnlineTrendCard class="order-4 lg:order-none" :server-id="server.id" />
      <ServerChatPanel class="order-5 lg:order-none" :server-id="server.id" />
      <ServerBluemapPanel class="order-7 lg:order-none" :server="server" />
    </div>
    <div class="contents lg:flex lg:flex-col lg:gap-4 lg:w-1/3">
      <ServerConnectCard class="order-2 lg:order-none" :server="server" />
      <ServerOnlinePlayersCard class="order-3 lg:order-none" :server-id="server.id" :type="server.type" :players="server.players" :max="server.max" />
      <ServerLeaderboardSummary class="order-6 lg:order-none" :server-id="server.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServerDetail } from '~/types/api'
defineProps<{ server: ServerDetail }>()
</script>
