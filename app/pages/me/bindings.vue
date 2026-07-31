<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <h1 class="text-2xl mb-6">{{ $t('nav.bindings') }}</h1>

    <div v-if="loading" class="space-y-3">
      <UiSkeleton v-for="i in 3" :key="i" :height="80" />
    </div>
    <div v-else-if="!servers.length">
      <UiEmpty :message="$t('empty.servers')" />
    </div>
    <div v-else class="space-y-3">
      <UiCard v-for="s in servers" :key="s.id" padded>
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-lg bg-bg-overlay overflow-hidden grid place-items-center shrink-0">
            <img v-if="s.icon" :src="s.icon" :alt="s.name" class="w-full h-full object-cover">
            <LucideServer v-else :size="20" class="text-text-tertiary" />
          </div>
          <div class="flex-1 min-w-0">
            <h3>{{ s.name }}</h3>
            <p v-if="connectHint(s)" class="text-xs text-text-tertiary">{{ connectHint(s) }}</p>
            <p v-if="statusMap[s.id]?.bound" class="mt-2 text-sm text-success">
              {{ $t('server.bind_status_bound', { name: statusMap[s.id]?.player?.name }) }}
            </p>
            <p v-else class="mt-2 text-sm text-text-tertiary">
              {{ $t('server.bind_status_unbound') }}
            </p>
            <p v-if="codeMap[s.id]" class="mt-2 text-sm">
              {{ $t('server.bind_instruction', { code: codeMap[s.id]?.code }) }}
            </p>
          </div>
          <div class="shrink-0 flex flex-col gap-2">
            <UiButton
              v-if="!statusMap[s.id]?.bound"
              size="sm"
              variant="primary"
              :loading="actionId === s.id"
              @click="requestCode(s.id)"
            >
              {{ $t('server.bind_get_code') }}
            </UiButton>
            <UiButton
              v-else
              size="sm"
              variant="danger"
              :loading="actionId === s.id"
              @click="askUnbind(s.id)"
            >
              {{ $t('actions.unbind') }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <UiConfirmModal
      :open="unbindModalOpen"
      :title="$t('actions.unbind')"
      :message="$t('server.bind_unbind_confirm')"
      variant="danger"
      :loading="actionId === unbindTarget"
      @update:open="unbindModalOpen = $event"
      @confirm="doUnbind"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import type { DstMeta, ServerSummary, BindStatus, BindCode } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { extractEndpoints, formatEndpoint } from '~/composables/useServerConnect'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })
const toast = useToast()
const { t } = useI18n()

const servers = ref<ServerSummary[]>([])
const statusMap = reactive<Record<number, BindStatus>>({})
const codeMap = reactive<Record<number, BindCode>>({})
const loading = ref(true)
const actionId = ref<number | null>(null)
const unbindTarget = ref<number | null>(null)
const unbindModalOpen = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  try {
    const r = await useApi<{ items: ServerSummary[] }>('/api/servers')
    servers.value = r.items
    await Promise.all(servers.value.map((s) => refreshStatus(s.id)))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    loading.value = false
  }
  // Refresh bind status every 5s when there's a pending code
  pollTimer = setInterval(() => {
    Object.keys(codeMap).forEach((k) => {
      const sid = Number(k)
      if (codeMap[sid]) void refreshStatus(sid)
    })
  }, 5000)
})

onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer) })

async function refreshStatus(sid: number) {
  try {
    const r = await useApi<BindStatus>(`/api/servers/${sid}/bind/status`)
    statusMap[sid] = r
    if (r.bound && codeMap[sid]) {
      delete codeMap[sid]
      toast.success(t('server.bind_success'))
    }
  } catch (e) {
    // tolerate
    void e
  }
}

async function requestCode(sid: number) {
  actionId.value = sid
  try {
    const r = await useApi<BindCode>(`/api/servers/${sid}/bind/code`, { method: 'POST' })
    codeMap[sid] = r
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    actionId.value = null
  }
}

function connectHint(s: ServerSummary): string {
  if (s.type === 'dst') {
    const name = (s.meta as DstMeta | undefined)?.find_by_name
    return name ? t('server.dst_search_name_short', { name }) : ''
  }
  const eps = extractEndpoints(s)
  return eps.length ? formatEndpoint(s.type, eps[0]!) : ''
}

function askUnbind(sid: number) {
  unbindTarget.value = sid
  unbindModalOpen.value = true
}

async function doUnbind() {
  if (unbindTarget.value == null) return
  const sid = unbindTarget.value
  actionId.value = sid
  try {
    await useApi(`/api/servers/${sid}/bind`, { method: 'DELETE' })
    toast.success(t('server.bind_unbound'))
    unbindModalOpen.value = false
    await refreshStatus(sid)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    actionId.value = null
    unbindTarget.value = null
  }
}
</script>
