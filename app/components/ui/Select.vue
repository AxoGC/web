<template>
  <SelectRoot
    :model-value="rootValue"
    :disabled="disabled"
    @update:model-value="onUpdate"
  >
    <SelectTrigger v-bind="$attrs" :class="triggerClasses">
      <!--
        A present-but-empty default slot suppresses SelectValue's own
        placeholder fallback, so the override slot is only supplied when
        there's an actual label to show — otherwise SelectValue is left with
        no slot at all, so its native placeholder behavior still applies.
      -->
      <SelectValue v-if="currentLabel" :placeholder="placeholder" class="truncate text-left flex-1">
        {{ currentLabel }}
      </SelectValue>
      <SelectValue v-else :placeholder="placeholder" class="truncate text-left flex-1" />
      <LucideChevronDown :size="16" class="text-text-tertiary shrink-0 ml-2" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="z-50 bg-bg-elevated border border-border-default rounded-md shadow-md text-sm overflow-hidden"
        :style="{ width: 'var(--reka-select-trigger-width)' }"
      >
        <SelectViewport class="p-1 max-h-64 overflow-auto">
          <SelectItem
            v-for="opt in options"
            :key="String(opt.value)"
            :value="toItemValue(opt.value)"
            :disabled="opt.disabled"
            class="relative flex items-center justify-between gap-2 px-2 py-1.5 rounded cursor-pointer select-none text-text-primary data-[highlighted]:bg-brand-soft data-[highlighted]:outline-none data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
          >
            <SelectItemText>{{ opt.label }}</SelectItemText>
            <SelectItemIndicator class="text-brand-400">
              <LucideCheck :size="14" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent,
  SelectViewport, SelectItem, SelectItemText, SelectItemIndicator,
} from 'reka-ui'

// SelectTrigger (not SelectRoot, which renders no DOM node of its own) is
// the element that should receive fallthrough attrs like class="w-32".
defineOptions({ inheritAttrs: false })

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
  block?: boolean
  size?: 'sm' | 'md' | 'lg'
  invalid?: boolean
}>(), {
  block: true,
  size: 'md',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

// Reka/Radix's Select reserves the empty string to mean "nothing selected"
// internally — an actual option whose value is "" (e.g. an "All" filter
// entry some pages use) would otherwise silently fail to register. Remap it
// to a private sentinel so it still behaves like a normal selectable item,
// while a genuinely unset modelValue (no "" option present) still falls
// through to the placeholder.
const EMPTY_SENTINEL = '__ui_select_empty__'
const hasEmptyOption = computed(() => props.options.some(o => o.value === ''))

function toItemValue(v: string | number): string | number {
  return v === '' ? EMPTY_SENTINEL : v
}
function fromItemValue(v: string | number | undefined): string | number {
  if (v === undefined) return ''
  return v === EMPTY_SENTINEL ? '' : v
}

// SelectValue only learns an item's label the first time SelectContent
// mounts (i.e. after the user opens it once) — a value set programmatically
// rather than by clicking renders blank until then. Supplying the label
// ourselves sidesteps that entirely.
const currentLabel = computed(() => props.options.find(o => o.value === props.modelValue)?.label ?? '')

const rootValue = computed<string | number | undefined>(() => {
  const v = props.modelValue
  if (v === undefined) return undefined
  if (v === '') return hasEmptyOption.value ? EMPTY_SENTINEL : undefined
  return v
})

function onUpdate(v: string | number | Record<string, unknown> | undefined) {
  emit('update:modelValue', fromItemValue(v as string | number | undefined))
}

const sizeClasses = computed(() => ({
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-base px-3',
  lg: 'h-12 text-lg px-4',
}[props.size]))

const triggerClasses = computed(() => [
  'flex items-center rounded-md transition-colors bg-bg-elevated',
  'border text-text-primary',
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
  'data-[disabled]:bg-bg-overlay data-[disabled]:cursor-not-allowed data-[disabled]:text-text-disabled',
  props.invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
  sizeClasses.value,
  props.block ? 'w-full' : '',
])
</script>
