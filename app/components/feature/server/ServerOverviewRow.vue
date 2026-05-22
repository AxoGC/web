<template>
  <ServerDescriptionCard
    v-if="hasDescription"
    class="lg:col-span-2"
    :server="server"
  />
  <ServerOnlinePlayersCard
    :class="hasDescription ? 'lg:col-span-1' : 'lg:col-span-3'"
    :server-id="server.id"
    :type="server.type"
    :players="server.players"
    :max="server.max"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerDetail } from '~/types/api'
import { isEmptyDoc } from '~/utils/tiptap'

// Multi-root component on purpose: the parent layout is a CSS grid, and we
// want description (col-span-2) and online (col-span-1) to be sibling grid
// items so they share a row. When there's no description, the online card
// takes the full row width.
const props = defineProps<{ server: ServerDetail }>()
const hasDescription = computed(() =>
  !!props.server.description && !isEmptyDoc(props.server.description),
)
</script>
