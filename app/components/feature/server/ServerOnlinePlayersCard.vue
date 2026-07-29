<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">{{ $t('server.online_players') }}</h2>
      <span class="text-sm text-text-tertiary">{{ players.length }}/{{ max }}</span>
    </div>
    <div v-if="!players.length" class="text-sm text-text-tertiary">
      {{ $t('server.no_online_players') }}
    </div>
    <div v-else class="max-h-72 overflow-y-auto grid grid-cols-2 gap-x-3 gap-y-1.5">
      <NuxtLink
        v-for="name in players"
        :key="name"
        :to="`/servers/${serverId}/players/${encodeURIComponent(name)}`"
        class="flex items-center gap-1.5 min-w-0 text-sm text-text-primary hover:text-brand-400 transition-colors"
      >
        <img
          v-if="avatarFor(name).src"
          :src="avatarFor(name).src"
          :alt="name"
          :class="['w-6 h-6 rounded-sm shrink-0', avatarFor(name).pixelated ? 'pixelated' : '']"
          loading="lazy"
          referrerpolicy="no-referrer"
        >
        <span class="font-medium truncate">{{ name }}</span>
      </NuxtLink>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { ServerType } from '~/types/api'

const props = defineProps<{
  serverId: string | number
  type: ServerType
  players: string[]
  max: number
}>()

const { avatarFor: rawAvatarFor } = useGameAvatar(props.type)
function avatarFor(name: string) {
  return rawAvatarFor(name, 32)
}
</script>

<style scoped>
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
}
</style>
