<template>
  <ServerDescriptionCard
    v-if="hasDescription"
    class="lg:col-span-2"
    :server="server"
  />
  <ServerConnectCard
    :class="hasDescription ? 'lg:col-span-1' : 'lg:col-span-3'"
    :server="server"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerDetail } from '~/types/api'
import { isEmptyDoc } from '~/utils/tiptap'

// Multi-root component on purpose, mirroring ServerOverviewRow: the parent
// layout is a CSS grid, and we want description (col-span-2) and connect
// info (col-span-1) as sibling grid items so they share a row. When there's
// no description, the connect card takes the full row width.
const props = defineProps<{ server: ServerDetail }>()
const hasDescription = computed(() =>
  !!props.server.description && !isEmptyDoc(props.server.description),
)
</script>
