<template>
  <ComboboxRoot :ignore-filter="true" class="block w-full" @update:model-value="onSelect">
    <ComboboxAnchor class="block w-full">
      <ComboboxInput
        :model-value="modelValue"
        :placeholder="placeholder"
        class="block w-full h-10 px-3 rounded-md border border-border-default bg-bg-elevated text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30"
        @update:model-value="onInput"
      />
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="4"
        hide-when-empty
        class="z-50 bg-bg-elevated border border-border-default rounded-md shadow-md p-1 text-sm max-h-56 overflow-auto"
        :style="{ width: 'var(--reka-combobox-trigger-width)' }"
      >
        <ComboboxViewport>
          <ComboboxItem
            v-for="s in suggestions"
            :key="s"
            :value="s"
            class="px-2 py-1.5 rounded cursor-pointer text-text-primary data-[highlighted]:bg-brand-soft data-[highlighted]:outline-none"
          >
            {{ s }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxRoot, ComboboxAnchor, ComboboxInput, ComboboxPortal,
  ComboboxContent, ComboboxViewport, ComboboxItem,
} from 'reka-ui'
import type { LogCategory } from '~/types/api'
import { ApiError } from '~/composables/useApi'

const props = defineProps<{
  modelValue?: string
  serverId: string | number
  category: LogCategory | ''
  field: 'player' | 'block_id' | 'item_id'
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const suggestions = ref<string[]>([])

let debouncer: ReturnType<typeof setTimeout> | null = null

// Remote suggestions only assist typing — the field stays free text, so a
// keystroke always updates the real value immediately; the dropdown is a
// debounced side effect, not the source of truth.
function onInput(value: string | number) {
  const text = String(value ?? '')
  emit('update:modelValue', text)
  if (debouncer) clearTimeout(debouncer)
  const prefix = text.trim()
  if (!prefix || !props.category) {
    suggestions.value = []
    return
  }
  debouncer = setTimeout(() => { void search(prefix) }, 300)
}

async function search(prefix: string) {
  try {
    const params = new URLSearchParams({ category: props.category, field: props.field, prefix })
    const r = await useApi<{ items: string[] }>(`/api/servers/${props.serverId}/log-field-values?${params}`)
    suggestions.value = r.items
  } catch (e) {
    if (e instanceof ApiError) suggestions.value = []
  }
}

function onSelect(value: unknown) {
  emit('update:modelValue', String(value ?? ''))
  suggestions.value = []
}
</script>
