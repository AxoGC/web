<template>
  <UiModal :open="open" :title="$t('server.bind_title')" size="sm" @update:open="onUpdateOpen">
    <UiSkeleton v-if="loading" :height="60" />
    <div v-else class="space-y-3 text-sm">
      <p v-if="status?.bound" class="text-success">
        {{ $t('server.bind_status_bound', { name: status.player?.name }) }}
      </p>
      <template v-else>
        <p class="text-text-tertiary">{{ $t('server.bind_status_unbound') }}</p>
        <p v-if="code" class="text-text-primary">
          {{ $t('server.bind_instruction', { code: code.code }) }}
        </p>
      </template>
    </div>

    <template #footer>
      <UiButton
        v-if="status?.bound"
        variant="danger"
        @click="confirmOpen = true"
      >
        {{ $t('actions.unbind') }}
      </UiButton>
      <UiButton
        v-else
        variant="primary"
        :loading="busy"
        @click="requestCode"
      >
        {{ $t('server.bind_get_code') }}
      </UiButton>
      <UiButton variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>

  <UiConfirmModal
    :open="confirmOpen"
    :title="$t('actions.unbind')"
    :message="$t('server.bind_unbind_confirm')"
    variant="danger"
    :loading="busy"
    @update:open="confirmOpen = $event"
    @confirm="doUnbind"
  />
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import type { BindStatus, BindCode } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ open: boolean, serverId: string | number }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const busy = ref(false)
const status = ref<BindStatus | null>(null)
const code = ref<BindCode | null>(null)
const confirmOpen = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function refreshStatus() {
  try {
    const r = await useApi<BindStatus>(`/api/servers/${props.serverId}/bind/status`)
    status.value = r
    if (r.bound && code.value) {
      code.value = null
      stopPolling()
      toast.success(t('server.bind_success'))
    }
  } catch (e) {
    // tolerate — this is a background poll, surfaced errors would just be noise
    void e
  }
}

// Re-fetch fresh status every time the dialog is (re)opened, and start
// polling only once a code has actually been requested for this open session.
watch(() => props.open, async (isOpen) => {
  if (!isOpen) {
    stopPolling()
    return
  }
  code.value = null
  confirmOpen.value = false
  // The status fetch is almost always faster than a perceivable loading
  // state (~100ms on a local network) — flipping `loading` immediately just
  // flashes the skeleton for a frame. Only show it if the fetch is actually
  // slow enough to need feedback.
  const timer = setTimeout(() => { loading.value = true }, 150)
  try {
    await refreshStatus()
  } finally {
    clearTimeout(timer)
    loading.value = false
  }
})

onBeforeUnmount(stopPolling)

async function requestCode() {
  busy.value = true
  try {
    const r = await useApi<BindCode>(`/api/servers/${props.serverId}/bind/code`, { method: 'POST' })
    code.value = r
    stopPolling()
    pollTimer = setInterval(() => void refreshStatus(), 5000)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busy.value = false
  }
}

async function doUnbind() {
  busy.value = true
  try {
    await useApi(`/api/servers/${props.serverId}/bind`, { method: 'DELETE' })
    toast.success(t('server.bind_unbound'))
    confirmOpen.value = false
    await refreshStatus()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busy.value = false
  }
}

function onUpdateOpen(value: boolean) {
  if (busy.value) return
  emit('update:open', value)
}
</script>
