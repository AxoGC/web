<template>
  <UiCard v-if="hasContent" padded>
    <h2 class="text-lg mb-3">{{ $t('server.description_title') }}</h2>
    <RichContent :doc="server.description" />
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerDetail } from '~/types/api'
import { isEmptyDoc } from '~/utils/tiptap'

const props = defineProps<{ server: ServerDetail }>()

// Self-gating: render nothing when there's no description doc, so detail
// pages can drop the card in unconditionally without leaving an empty box.
const hasContent = computed(() =>
  !!props.server.description && !isEmptyDoc(props.server.description),
)
</script>
