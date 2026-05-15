<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('checkin.title') }}</h1>

    <UiCard padded class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-brand-soft text-brand-400 grid place-items-center">
            <LucideFlame :size="22" />
          </div>
          <div>
            <p class="text-2xl font-bold">{{ streak }}</p>
            <p class="text-xs text-text-tertiary">{{ $t('checkin.streak', { n: streak }) }}</p>
          </div>
        </div>
        <div class="flex-1" />
        <UiButton
          :variant="todayDone ? 'secondary' : 'primary'"
          :disabled="todayDone || submitting"
          :loading="submitting"
          @click="onCheckIn"
        >
          {{ todayDone ? $t('checkin.today_done') : $t('actions.sign_today') }}
        </UiButton>
      </div>
    </UiCard>

    <UiCard padded>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{{ monthLabel }}</h2>
        <div class="flex gap-1">
          <button class="p-1.5 rounded-md hover:bg-bg-hover" @click="shiftMonth(-1)">
            <LucideChevronLeft :size="16" />
          </button>
          <button class="p-1.5 rounded-md hover:bg-bg-hover" @click="shiftMonth(1)">
            <LucideChevronRight :size="16" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-xs text-text-tertiary">
        <div v-for="d in weekdays" :key="d">{{ d }}</div>
      </div>
      <div class="mt-2 grid grid-cols-7 gap-1">
        <div v-for="(cell, i) in cells" :key="i">
          <div
            v-if="cell"
            :class="[
              'h-10 grid place-items-center rounded-md text-sm border',
              cell.checked
                ? 'bg-brand-soft border-brand-500/40 text-brand-400'
                : 'bg-bg-elevated border-border-subtle text-text-tertiary',
            ]"
            :title="cell.date"
          >
            {{ cell.day }}
          </div>
          <div v-else class="h-10" />
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CheckInCalendar, CheckInResult } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })

const toast = useToast()
const { t } = useI18n()

const today = new Date()
const month = ref({ y: today.getFullYear(), m: today.getMonth() + 1 })
const calendar = ref<CheckInCalendar | null>(null)
const streak = ref(0)
const submitting = ref(false)

const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const monthParam = computed(() => `${month.value.y}-${String(month.value.m).padStart(2, '0')}`)
const monthLabel = computed(() => `${month.value.y}-${String(month.value.m).padStart(2, '0')}`)
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const todayDone = computed(() => {
  if (!calendar.value) return false
  return calendar.value.days.some((d) => d.date === todayStr && d.checked)
})

const cells = computed(() => {
  const arr: (null | { day: number, date: string, checked: boolean })[] = []
  const map = new Map(calendar.value?.days.map((d) => [d.date, d.checked]) || [])
  const first = new Date(month.value.y, month.value.m - 1, 1)
  const offset = first.getDay()
  for (let i = 0; i < offset; i++) arr.push(null)
  const days = new Date(month.value.y, month.value.m, 0).getDate()
  for (let d = 1; d <= days; d++) {
    const date = `${month.value.y}-${String(month.value.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    arr.push({ day: d, date, checked: !!map.get(date) })
  }
  return arr
})

async function load() {
  try {
    const c = await useApi<CheckInCalendar>(`/api/checkins/calendar?month=${monthParam.value}`)
    calendar.value = c
    streak.value = c.streak
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  }
}

function shiftMonth(delta: number) {
  const next = new Date(month.value.y, month.value.m - 1 + delta, 1)
  month.value = { y: next.getFullYear(), m: next.getMonth() + 1 }
  void load()
}

async function onCheckIn() {
  submitting.value = true
  try {
    const r = await useApi<CheckInResult>('/api/checkins', { method: 'POST' })
    streak.value = r.streak
    toast.success(t('checkin.checked_in'))
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => { void load() })
</script>
