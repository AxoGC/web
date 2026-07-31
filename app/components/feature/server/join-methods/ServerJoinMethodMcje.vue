<template>
  <div class="flex items-center gap-2 text-sm">
    <span v-if="method.label" class="text-xs text-text-tertiary shrink-0">{{ method.label }}</span>
    <span class="font-mono text-xs text-text-tertiary truncate">{{ method.address }}</span>
    <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0" @click="copy(method.address)">
      <LucideCopy :size="12" /> {{ $t('actions.copy') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { McjeJoinMethod } from '~/types/api'
import { useCopy } from '~/composables/useServerConnect'

defineProps<{ method: McjeJoinMethod, serverName?: string }>()
const { copy } = useCopy()
</script>
