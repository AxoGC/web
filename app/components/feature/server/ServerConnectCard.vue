<template>
  <UiCard padded>
    <h2 class="text-lg mb-3">{{ $t('server.connect_title') }}</h2>
    <ServerConnectInfo :server="server" />
  </UiCard>
</template>

<script setup lang="ts">
import type { ServerDetail } from '~/types/api'
defineProps<{ server: ServerDetail }>()
</script>
