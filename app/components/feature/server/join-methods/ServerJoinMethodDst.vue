<template>
  <div class="space-y-0.5 text-sm">
    <div class="flex items-center gap-2 flex-wrap">
      <span v-if="method.label" class="text-xs text-text-tertiary shrink-0">{{ method.label }}</span>
      <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.dst_search_name') }}</span>
      <span class="font-mono text-xs text-text-tertiary truncate">{{ method.name }}</span>
      <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0" @click="copy(method.name)">
        <LucideCopy :size="12" /> {{ $t('actions.copy') }}
      </button>
      <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.dst_command') }}</span>
      <span class="font-mono text-xs text-text-tertiary truncate">{{ method.command }}</span>
      <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0" @click="copy(method.command)">
        <LucideCopy :size="12" /> {{ $t('actions.copy') }}
      </button>
      <template v-if="method.password">
        <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.dst_password') }}</span>
        <span class="font-mono text-xs text-text-tertiary truncate">{{ method.password }}</span>
        <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0" @click="copy(method.password)">
          <LucideCopy :size="12" /> {{ $t('actions.copy') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DstJoinMethod } from '~/types/api'
import { useCopy } from '~/composables/useServerConnect'

defineProps<{ method: DstJoinMethod, serverName?: string }>()
const { copy } = useCopy()
</script>
