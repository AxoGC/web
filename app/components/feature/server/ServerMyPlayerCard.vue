<template>
  <UiCard v-if="axes.length" padded>
    <h2 class="text-lg mb-3">{{ $t('server.my_player_title') }}</h2>
    <div class="flex gap-4">
      <ClientOnly>
        <div v-show="skinAvailable" class="shrink-0">
          <canvas ref="canvasEl" class="w-24 h-36" />
        </div>
      </ClientOnly>
      <dl class="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <div v-for="axis in axes" :key="axis.key" class="flex items-center justify-between gap-3 text-sm">
          <dt class="text-text-tertiary truncate">{{ metrics.labelFor(axis.key) }}</dt>
          <dd class="font-mono text-text-primary tabular-nums">{{ metrics.formatScore(axis.key, axis.value) }}</dd>
        </div>
      </dl>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import type { PlayerStats, StatsAxis } from '~/types/api'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ serverId: string | number }>()
const auth = useAuthStore()
const metrics = useServerMetrics(toRef(props, 'serverId'))

interface BindStatusResp {
  bound: boolean
  player?: { name: string, bound_at: number }
}

// Card shows the current user's own bound character on this server — hidden
// entirely for logged-out visitors or anyone who hasn't bound a character
// (self-gating, same pattern as ServerDescriptionCard).
const { data: bindStatus } = await useAsyncData(
  () => `server.myplayer.bind.${props.serverId}`,
  () => auth.isLoggedIn
    ? useApi<BindStatusResp>(`/api/servers/${props.serverId}/bind/status`).catch(() => null)
    : Promise.resolve(null),
  { watch: [() => auth.isLoggedIn] },
)
const playerName = computed(() => bindStatus.value?.bound ? bindStatus.value.player?.name : undefined)

const { data: statsData } = await useAsyncData(
  () => `server.myplayer.stats.${props.serverId}.${playerName.value}`,
  async () => {
    if (!playerName.value) return null
    await metrics.ready.value
    return useApi<PlayerStats>(`/api/servers/${props.serverId}/players/${encodeURIComponent(playerName.value)}/stats`).catch(() => null)
  },
  { watch: [playerName] },
)
const axes = computed<StatsAxis[]>(() => statsData.value?.stats?.slice(0, 6) ?? [])

const canvasEl = ref<HTMLCanvasElement | null>(null)
const skinAvailable = ref(false)
let viewer: import('skinview3d').SkinViewer | null = null

function disposeViewer() {
  viewer?.dispose()
  viewer = null
}

// Skin is optional flourish, not the point of the card: try to load it against
// the already-mounted (but hidden) canvas, and only reveal it on success — a
// Bedrock/DST/Terraria name or an unbound Java account never resolves via the
// skin proxy, so this silently falls back to stats-only.
watch([canvasEl, playerName], async ([el, name]) => {
  disposeViewer()
  skinAvailable.value = false
  if (!el || !name) return
  const { SkinViewer } = await import('skinview3d')
  const v = new SkinViewer({ canvas: el, width: 96, height: 144 })
  v.autoRotate = true
  v.autoRotateSpeed = 0.8
  try {
    await v.loadSkin(`/api/servers/${props.serverId}/players/${encodeURIComponent(name)}/skin`)
    viewer = v
    skinAvailable.value = true
  }
  catch {
    v.dispose()
  }
}, { immediate: true })

onBeforeUnmount(disposeViewer)
</script>
