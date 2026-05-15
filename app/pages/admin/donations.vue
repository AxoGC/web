<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t('admin.donations') }}</h1>

    <UiCard padded class="mb-6">
      <h2 class="text-lg font-semibold mb-4">{{ $t('donation.admin_add') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UiField :label="$t('donation.admin_user_id')">
          <UiInput v-model="form.userId" type="number" />
        </UiField>
        <UiField :label="$t('donation.admin_amount')" required>
          <UiInput v-model="form.amount" type="number" inputmode="decimal" />
        </UiField>
        <UiField :label="$t('donation.admin_donated_at')">
          <UiInput v-model="form.donatedAt" type="datetime-local" />
        </UiField>
        <UiField :label="$t('donation.admin_message')">
          <UiInput v-model="form.message" />
        </UiField>
      </div>
      <div class="flex items-center justify-between gap-3 mt-2">
        <label class="inline-flex items-center gap-2 text-sm select-none">
          <input v-model="form.public" type="checkbox" class="w-4 h-4 accent-brand-500">
          {{ $t('donation.admin_public') }}
        </label>
        <UiButton :loading="saving" @click="submit">{{ $t('actions.submit') }}</UiButton>
      </div>
    </UiCard>

    <h2 class="text-lg font-semibold mb-3">Recent</h2>
    <UiCard>
      <ul>
        <li
          v-for="(d, i) in recent"
          :key="i"
          class="flex items-center gap-3 px-5 py-3 border-b border-border-subtle last:border-b-0"
        >
          <span class="text-text-tertiary text-xs w-8">{{ i + 1 }}</span>
          <span class="flex-1 truncate">{{ d.display_name }}</span>
          <span class="font-mono">¥{{ d.amount.toFixed(2) }}</span>
        </li>
      </ul>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import type { DonationItem } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()
const { t } = useI18n()

const form = reactive({
  userId: '',
  amount: '',
  message: '',
  public: true,
  donatedAt: '',
})
const saving = ref(false)
const recent = ref<DonationItem[]>([])

async function load() {
  try {
    const r = await useApi<{ items: DonationItem[] }>('/api/donations/ranking?limit=20')
    recent.value = r.items
  } catch { /* ignore */ }
}

async function submit() {
  const amount = parseFloat(form.amount)
  if (!isFinite(amount) || amount <= 0) {
    toast.error(t('errors.AMOUNT_INVALID'))
    return
  }
  const body: Record<string, unknown> = {
    amount,
    message: form.message,
    public: form.public,
    donated_at: form.donatedAt ? Math.floor(new Date(form.donatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
  }
  if (form.userId.trim()) body.user_id = Number(form.userId)
  saving.value = true
  try {
    await useApi('/api/donations', { method: 'POST', body })
    toast.success(t('actions.save'))
    form.amount = ''
    form.message = ''
    form.userId = ''
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
