<template>
  <DropdownMenuItem
    :disabled="disabled"
    :class="[
      'flex items-center gap-2 px-2.5 h-9 rounded-md cursor-pointer select-none',
      'text-text-primary hover:bg-bg-hover focus:outline-none data-[highlighted]:bg-bg-hover',
      danger ? 'text-danger hover:bg-danger-soft data-[highlighted]:bg-danger-soft' : '',
      disabled ? 'opacity-50 pointer-events-none' : '',
    ]"
    @select="$emit('select')"
  >
    <slot />
  </DropdownMenuItem>
</template>

<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui'
defineProps<{
  disabled?: boolean
  danger?: boolean
}>()
defineEmits<{ select: [] }>()
</script>
