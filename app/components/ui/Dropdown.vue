<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="6"
        :class="[
          'min-w-[10rem] z-50 bg-bg-elevated border border-border-default rounded-md',
          'shadow-md p-1 text-sm',
          'data-[state=open]:animate-fadein',
        ]"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
} from 'reka-ui'

withDefaults(defineProps<{
  align?: 'start' | 'center' | 'end'
}>(), {
  align: 'end',
})
</script>
