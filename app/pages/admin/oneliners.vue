<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl">{{ $t('admin.oneliners') }}</h1>
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="t in TABS"
          :key="t"
          :variant="status === t ? 'primary' : 'secondary'"
          size="sm"
          @click="status = t"
        >
          {{ $t(`admin.oneliner_tab_${t}`) }}
        </UiButton>
      </div>
    </header>

    <UiTable v-if="pending || items.length > 0">
      <template #head>
        <tr>
          <th class="text-left px-4 py-2 w-12">ID</th>
          <th class="text-left px-4 py-2">{{ $t('admin.oneliner_text') }}</th>
          <th class="text-left px-4 py-2 w-48">{{ $t('admin.oneliner_author') }}</th>
          <th class="text-left px-4 py-2 w-36">{{ $t('admin.oneliner_submitted_at') }}</th>
          <th class="text-left px-4 py-2 w-24">{{ $t('admin.status') }}</th>
          <th class="text-right px-4 py-2 w-48">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 3" :key="i" class="border-t border-border-subtle">
          <td colspan="6" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="o in items" :key="o.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary">{{ o.id }}</td>
          <td class="px-4 py-2 max-w-[28rem]">
            <p class="italic text-text-primary break-words">{{ o.text }}</p>
          </td>
          <td class="px-4 py-2">
            <NuxtLink
              v-if="o.author.id"
              :to="`/users/${o.author.id}`"
              class="inline-flex items-center gap-2 hover:text-brand-400"
            >
              <UiAvatar :src="o.author.avatar" :name="o.author.username" size="xs" />
              <span class="truncate">{{ o.author.username }}</span>
            </NuxtLink>
            <span v-else class="text-text-tertiary">—</span>
          </td>
          <td class="px-4 py-2 text-xs text-text-tertiary">
            {{ formatDate(o.created_at) }}
          </td>
          <td class="px-4 py-2">
            <UiTag v-if="o.active" variant="success">{{ $t('admin.oneliner_status_active') }}</UiTag>
            <UiTag v-else variant="info">{{ $t('admin.oneliner_status_pending') }}</UiTag>
          </td>
          <td class="px-4 py-2 text-right">
            <UiButton
              v-if="!o.active"
              size="sm"
              variant="primary"
              :loading="busyId === o.id"
              @click="approve(o)"
            >
              {{ $t('admin.oneliner_approve') }}
            </UiButton>
            <UiButton
              size="sm"
              variant="ghost"
              class="text-danger"
              :loading="busyId === o.id"
              @click="askReject(o)"
            >
              {{ $t('admin.oneliner_reject') }}
            </UiButton>
          </td>
        </tr>
      </template>
    </UiTable>
    <UiEmpty v-else :message="$t('admin.oneliner_empty')" />

    <UiConfirmModal
      :open="rejectOpen"
      :title="$t('admin.oneliner_reject')"
      :message="rejectTarget ? `${$t('admin.oneliner_reject_confirm')}\n\n“${rejectTarget.text}”` : ''"
      variant="danger"
      :loading="busyId === rejectTarget?.id"
      @update:open="rejectOpen = $event"
      @confirm="doReject"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })

interface Author { id: number, username: string, avatar: string }
interface AdminOneliner {
  id: number
  text: string
  active: boolean
  created_at: number
  author: Author
}

const toast = useToast()
const { t } = useI18n()

const TABS = ['pending', 'active', 'all'] as const
type Tab = typeof TABS[number]
const status = ref<Tab>('pending')

const items = ref<AdminOneliner[]>([])
const pending = ref(false)
const busyId = ref<number | null>(null)

const rejectOpen = ref(false)
const rejectTarget = ref<AdminOneliner | null>(null)

async function load() {
  pending.value = true
  try {
    const r = await useApi<{ items: AdminOneliner[] }>(`/api/admin/oneliners?status=${status.value}`)
    items.value = r.items || []
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    pending.value = false
  }
}

async function approve(o: AdminOneliner) {
  busyId.value = o.id
  try {
    await useApi(`/api/admin/oneliners/${o.id}/approve`, { method: 'POST' })
    toast.success(t('admin.oneliner_approved'))
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busyId.value = null
  }
}

function askReject(o: AdminOneliner) {
  rejectTarget.value = o
  rejectOpen.value = true
}

async function doReject() {
  if (!rejectTarget.value) return
  busyId.value = rejectTarget.value.id
  try {
    await useApi(`/api/admin/oneliners/${rejectTarget.value.id}`, { method: 'DELETE' })
    toast.success(t('admin.oneliner_rejected'))
    rejectOpen.value = false
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busyId.value = null
    rejectTarget.value = null
  }
}

watch(status, load)
onMounted(load)

useHead(() => ({ title: t('admin.oneliners') }))
</script>
