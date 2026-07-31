<template>
  <UiCard v-if="playerName" padded>
    <h2 class="text-lg mb-3">{{ $t('server.my_player_title') }}</h2>
    <PlayerActivityPanel :server-id="serverId" :game-name="playerName" />
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ serverId: string | number }>()
const auth = useAuthStore()

interface BindStatusResp {
  bound: boolean
  player?: { name: string, bound_at: number }
}

// Card shows the current user's own bound character on this server — hidden
// entirely for logged-out visitors or anyone who hasn't bound a character
// (self-gating, same pattern as ServerDescriptionCard). Everything else
// (playtime bar, skin, radar, stat grid) lives in the shared
// PlayerActivityPanel, reused as-is on the user profile page.
const { data: bindStatus } = await useAsyncData(
  () => `server.myplayer.bind.${props.serverId}`,
  () => auth.isLoggedIn
    ? useApi<BindStatusResp>(`/api/servers/${props.serverId}/bind/status`).catch(() => null)
    : Promise.resolve(null),
  { watch: [() => auth.isLoggedIn] },
)
const playerName = computed(() => bindStatus.value?.bound ? bindStatus.value.player?.name : undefined)
</script>
