<template>
  <div class="flex items-center gap-2 text-sm">
    <span v-if="method.label" class="text-xs text-text-tertiary shrink-0">{{ method.label }}</span>
    <span class="font-mono text-xs text-text-tertiary truncate">{{ method.host }}:{{ method.port }}</span>
    <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0" @click="copy(`${method.host}:${method.port}`)">
      <LucideCopy :size="12" /> {{ $t('actions.copy') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TerrariaJoinMethod } from '~/types/api'
import { useCopy } from '~/composables/useServerConnect'

defineProps<{ method: TerrariaJoinMethod }>()
const { copy } = useCopy()
</script>
