<template>
  <TabsRoot :model-value="modelValue" @update:model-value="(v) => $emit('update:modelValue', v as string)">
    <TabsList class="flex items-center gap-1 border-b border-border-subtle">
      <TabsTrigger
        v-for="t in tabs"
        :key="t.value"
        :value="t.value"
        :class="[
          'px-4 h-10 inline-flex items-center text-sm font-medium transition-colors',
          'text-text-secondary hover:text-text-primary',
          'data-[state=active]:text-brand-400 data-[state=active]:border-b-2 data-[state=active]:border-brand-500',
          'focus:outline-none',
        ]"
      >
        {{ t.label }}
      </TabsTrigger>
    </TabsList>
    <div class="mt-4">
      <slot />
    </div>
  </TabsRoot>
</template>

<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui'

defineProps<{
  modelValue: string
  tabs: { value: string, label: string }[]
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
