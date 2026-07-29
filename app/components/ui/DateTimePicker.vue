<template>
  <!--
    getLocalTimeZone() resolves against the server's timezone during SSR and
    the browser's during hydration — almost never the same — so segment text
    (and which "today" is highlighted) can genuinely differ between the two
    passes. Client-only sidesteps that instead of fighting it.
  -->
  <ClientOnly>
    <DatePickerRoot
      :model-value="internalValue"
      granularity="minute"
      hide-time-zone
      :disabled="disabled"
      @update:model-value="onUpdate"
    >
      <DatePickerField
        v-slot="{ segments }"
        :class="[
          'flex items-center h-10 px-3 rounded-md border bg-bg-elevated text-text-primary text-sm gap-0.5',
          'focus-within:outline-none focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-400/30',
          'data-[disabled]:bg-bg-overlay data-[disabled]:cursor-not-allowed data-[disabled]:text-text-disabled',
          'border-border-default hover:border-border-strong',
          block ? 'w-full' : '',
        ]"
      >
        <template v-for="seg in timeSegments(segments)" :key="seg.part">
          <DatePickerInput
            :part="seg.part"
            :class="seg.part === 'literal'
              ? 'text-text-tertiary'
              : 'px-0.5 rounded tabular-nums text-center focus:bg-brand-soft focus:text-brand-400 focus:outline-none data-[placeholder]:text-text-tertiary'"
          >
            {{ seg.value }}
          </DatePickerInput>
        </template>
        <span class="flex-1" />
        <DatePickerTrigger class="text-text-tertiary hover:text-text-primary focus:outline-none">
          <LucideCalendar :size="16" />
        </DatePickerTrigger>
      </DatePickerField>

      <DatePickerAnchor />
      <DatePickerContent
        :side-offset="4"
        class="z-50 bg-bg-elevated border border-border-default rounded-md shadow-md p-3 text-sm"
      >
        <DatePickerCalendar v-slot="{ weekDays, grid }">
          <DatePickerHeader class="flex items-center justify-between mb-2">
            <DatePickerPrev class="w-7 h-7 grid place-items-center rounded hover:bg-bg-hover text-text-secondary">
              <LucideChevronLeft :size="16" />
            </DatePickerPrev>
            <DatePickerHeading class="text-sm font-medium" />
            <DatePickerNext class="w-7 h-7 grid place-items-center rounded hover:bg-bg-hover text-text-secondary">
              <LucideChevronRight :size="16" />
            </DatePickerNext>
          </DatePickerHeader>
          <DatePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse select-none"
          >
            <DatePickerGridHead>
              <DatePickerGridRow class="grid grid-cols-7 mb-1">
                <DatePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="text-xs text-text-tertiary font-normal text-center"
                >
                  {{ day }}
                </DatePickerHeadCell>
              </DatePickerGridRow>
            </DatePickerGridHead>
            <DatePickerGridBody class="grid gap-y-0.5">
              <DatePickerGridRow v-for="(weekDates, i) in month.rows" :key="i" class="grid grid-cols-7">
                <DatePickerCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate" class="text-center p-0">
                  <DatePickerCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="w-8 h-8 grid place-items-center rounded-md text-sm text-text-primary outline-none hover:bg-bg-hover data-[selected]:bg-brand-500 data-[selected]:text-brand-on data-[outside-view]:text-text-disabled data-[today]:font-semibold data-[unavailable]:opacity-40 data-[unavailable]:line-through focus:ring-2 focus:ring-brand-400/30"
                  />
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>

    <template #fallback>
      <div
        :class="[
          'h-10 rounded-md border border-border-default bg-bg-elevated animate-pulse',
          block ? 'w-full' : 'w-48',
        ]"
      />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DatePickerRoot, DatePickerField, DatePickerInput, DatePickerTrigger, DatePickerAnchor,
  DatePickerContent, DatePickerCalendar, DatePickerHeader, DatePickerHeading,
  DatePickerPrev, DatePickerNext, DatePickerGrid, DatePickerGridHead, DatePickerGridRow,
  DatePickerHeadCell, DatePickerGridBody, DatePickerCell, DatePickerCellTrigger,
  type SegmentPart,
} from 'reka-ui'
import { fromDate, getLocalTimeZone, type DateValue } from '@internationalized/date'

// Public API is plain Unix seconds — the app only ever needs "what wall-clock
// moment did the user pick", never the intermediate calendar value type —
// so all @internationalized/date plumbing stays internal to this component.
const props = withDefaults(defineProps<{
  modelValue?: number
  disabled?: boolean
  block?: boolean
}>(), {
  block: true,
})
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()

const tz = getLocalTimeZone()

// The calendar popover (opened via the trigger icon) already covers date
// entry, so the inline field only needs to show the time segments — drop
// month/day/year and their separators, which otherwise overflow narrow
// (e.g. mobile landscape) layouts.
function timeSegments(segments: { part: SegmentPart, value: string }[]) {
  const idx = segments.findIndex(s => s.part === 'hour' || s.part === 'dayPeriod')
  return idx === -1 ? segments : segments.slice(idx)
}

const internalValue = computed<DateValue | undefined>(() =>
  props.modelValue ? fromDate(new Date(props.modelValue * 1000), tz) : undefined,
)

function onUpdate(v: DateValue | undefined) {
  if (!v) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', Math.floor(v.toDate(tz).getTime() / 1000))
}
</script>
