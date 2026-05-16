<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">{{ $t('server.online_players') }}</h2>
      <span class="text-sm text-text-tertiary">{{ players.length }}/{{ max }}</span>
    </div>
    <div v-if="!players.length" class="text-sm text-text-tertiary">
      {{ $t('server.no_online_players') }}
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <NuxtLink
        v-for="name in players"
        :key="name"
        :to="`/servers/${serverId}/players/${encodeURIComponent(name)}`"
        class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-bg-overlay hover:bg-bg-hover transition-colors"
      >
        <img
          v-if="avatarFor(name).src"
          :src="avatarFor(name).src"
          :alt="name"
          :class="['w-7 h-7 rounded-full', avatarFor(name).pixelated ? 'pixelated' : '']"
          loading="lazy"
          referrerpolicy="no-referrer"
        >
        <span v-else class="w-7 h-7 rounded-full bg-bg-base grid place-items-center text-xs font-semibold text-text-secondary">
          {{ name.slice(0, 1).toUpperCase() }}
        </span>
        <span class="text-sm font-medium">{{ name }}</span>
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
