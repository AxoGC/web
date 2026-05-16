<template>
  <div class="space-y-1.5 text-sm">
    <div v-if="findByName" class="flex items-center gap-2">
      <span class="text-xs text-text-tertiary shrink-0">{{ $t('server.dst_search_name') }}</span>
      <span class="font-mono text-xs text-text-primary truncate">{{ findByName }}</span>
      <button class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1" @click="conn.copy(findByName)">
        <LucideCopy :size="12" /> {{ $t('actions.copy') }}
      </button>
    </div>
    <p v-if="passwordHint" class="text-xs text-text-tertiary">
      {{ $t('server.dst_password_hint') }}{{ passwordHint }}
    </p>
    <p v-if="!findByName" class="text-xs text-text-tertiary">{{ $t('server.connect_missing') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DstMeta, ServerDetail } from '~/types/api'

const props = defineProps<{ server: ServerDetail }>()
const conn = useServerConnect(() => props.server)
const meta = computed(() => (props.server.meta || {}) as DstMeta)
const findByName = computed(() => meta.value.find_by_name || '')
const passwordHint = computed(() => meta.value.password_hint || '')
</script>
