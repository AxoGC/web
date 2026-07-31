<template>
  <UiCard v-if="bluemapUrl" padded>
    <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
      <h2 class="text-lg">{{ $t('server.bluemap_title') }}</h2>
      <div class="flex items-center gap-2">
        <UiButton
          v-if="expanded"
          size="sm"
          variant="ghost"
          @click="toggleFullscreen"
        >
          <template #leading>
            <LucideMinimize v-if="isFullscreen" :size="14" />
            <LucideMaximize v-else :size="14" />
          </template>
          {{ isFullscreen ? $t('server.bluemap_exit_fullscreen') : $t('server.bluemap_fullscreen') }}
        </UiButton>
        <UiButton
          v-if="expanded"
          size="sm"
          variant="ghost"
          @click="collapse"
        >
          <template #leading><LucideX :size="14" /></template>
          {{ $t('server.bluemap_collapse') }}
        </UiButton>
        <a
          :href="bluemapUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <LucideExternalLink :size="14" />
          <span>{{ $t('server.bluemap_open_new_tab') }}</span>
        </a>
      </div>
    </div>

    <!-- Collapsed: cheap placeholder that doesn't load the iframe. BlueMap is
         WebGL-heavy; rendering it on every server-detail visit jank-stalls the
         whole page even when the user just wants the forum or leaderboard. -->
    <button
      v-if="!expanded"
      type="button"
      class="w-full bg-bg-overlay/60 hover:bg-bg-overlay border border-border-subtle rounded-md py-10 flex flex-col items-center gap-2 transition-colors"
      @click="expand"
    >
      <LucideMap :size="32" class="text-text-tertiary" />
      <span class="text-sm font-medium">{{ $t('server.bluemap_load') }}</span>
      <span class="text-xs text-text-tertiary">{{ $t('server.bluemap_load_hint') }}</span>
    </button>

    <!-- Expanded: the iframe lives inside the same element we request
         fullscreen on so it actually fills the screen on toggle (browsers
         escape from nested iframes when fullscreening only the iframe). -->
    <div
      v-else
      ref="container"
      class="relative bg-black rounded-md overflow-hidden"
      :style="containerStyle"
    >
      <iframe
        :src="bluemapUrl"
        class="absolute inset-0 w-full h-full border-0"
        loading="lazy"
        referrerpolicy="no-referrer"
        :title="$t('server.bluemap_title')"
        allow="fullscreen"
        allowfullscreen
      />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { McBedrockMeta, McJavaMeta, ServerDetail } from '~/types/api'

const props = defineProps<{ server: ServerDetail }>()

const bluemapUrl = computed<string>(() => {
  const meta = props.server.meta as (McJavaMeta | McBedrockMeta) | undefined
  return meta?.bluemap_url || ''
})

const expanded = ref(false)
const container = ref<HTMLDivElement | null>(null)
const isFullscreen = ref(false)

const containerStyle = computed(() => (
  isFullscreen.value ? { height: '100%' } : { height: 'min(70vh, 600px)' }
))

function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === container.value
}

function expand() { expanded.value = true }
function collapse() {
  if (isFullscreen.value) void document.exitFullscreen()
  expanded.value = false
}

function toggleFullscreen() {
  if (!container.value) return
  if (document.fullscreenElement === container.value) {
    void document.exitFullscreen()
  } else {
    void container.value.requestFullscreen()
  }
}

// Bind the fullscreenchange listener only while the iframe exists; collapse
// removes the container DOM node, so we wire/unwire to match.
watch(expanded, async (v) => {
  if (!import.meta.client) return
  if (v) {
    await nextTick()
    document.addEventListener('fullscreenchange', onFullscreenChange)
  } else {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    isFullscreen.value = false
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>
