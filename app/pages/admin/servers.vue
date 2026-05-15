<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">{{ $t('admin.servers') }}</h1>
      <UiButton @click="openCreate">
        <template #leading><LucidePlus :size="16" /></template>
        {{ $t('actions.create') }}
      </UiButton>
    </header>

    <UiTable>
      <template #head>
        <tr>
          <th class="text-left px-4 py-2">ID</th>
          <th class="text-left px-4 py-2">{{ $t('admin.server_form_name') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.server_form_type') }}</th>
          <th class="text-left px-4 py-2">Host</th>
          <th class="text-left px-4 py-2">{{ $t('admin.status') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 3" :key="i" class="border-t border-border-subtle">
          <td colspan="6" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="s in servers" :key="s.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary">{{ s.id }}</td>
          <td class="px-4 py-2 font-medium">{{ s.name }}</td>
          <td class="px-4 py-2">{{ s.type }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ s.host }}:{{ s.port }}</td>
          <td class="px-4 py-2">
            <UiStatusDot :status="s.status">
              <span class="text-text-secondary">{{ s.online }}/{{ s.max }}</span>
            </UiStatusDot>
          </td>
          <td class="px-4 py-2 text-right">
            <UiButton size="sm" variant="ghost" @click="openEdit(s)">{{ $t('actions.edit') }}</UiButton>
            <UiButton size="sm" variant="ghost" @click="resetToken(s)">Token</UiButton>
            <UiButton size="sm" variant="ghost" class="text-danger" @click="askDelete(s)">{{ $t('actions.delete') }}</UiButton>
          </td>
        </tr>
      </template>
    </UiTable>

    <UiModal :open="formOpen" :title="editing ? $t('actions.edit') : $t('actions.create')" @update:open="formOpen = $event">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UiField :label="$t('admin.server_form_name')" required>
          <UiInput v-model="form.name" />
        </UiField>
        <UiField :label="$t('admin.server_form_type')" required>
          <UiInput v-model="form.type" placeholder="mc-java / mc-bedrock / dst …" />
        </UiField>
        <UiField :label="$t('admin.server_form_host')" required>
          <UiInput v-model="form.host" />
        </UiField>
        <UiField :label="$t('admin.server_form_port')" required>
          <UiInput v-model="form.port" type="number" />
        </UiField>
        <UiField :label="$t('admin.server_form_desc')">
          <UiTextarea v-model="form.description" :rows="2" />
        </UiField>
        <UiField :label="$t('admin.server_form_meta')">
          <UiTextarea v-model="form.metaText" :rows="2" placeholder='{"motd":"…"}' />
        </UiField>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="formOpen = false">{{ $t('actions.cancel') }}</UiButton>
        <UiButton :loading="saving" @click="submitForm">{{ $t('actions.save') }}</UiButton>
      </template>
    </UiModal>

    <UiModal :open="tokenOpen" :title="$t('admin.token_created')" @update:open="tokenOpen = $event">
      <p class="text-text-secondary text-sm mb-2">Copy this token now — it won't be shown again.</p>
      <div class="bg-bg-overlay font-mono text-xs p-3 rounded-md break-all select-all">{{ tokenValue }}</div>
      <template #footer>
        <UiButton @click="copyToken">{{ $t('actions.copy') }}</UiButton>
      </template>
    </UiModal>

    <UiConfirmModal
      :open="deleteOpen"
      :title="$t('actions.delete')"
      :message="`${$t('actions.delete')}: ${deleteTarget?.name}?`"
      variant="danger"
      :loading="deleting"
      @update:open="deleteOpen = $event"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { ServerSummary } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()
const { t } = useI18n()

const servers = ref<ServerSummary[]>([])
const pending = ref(false)

const formOpen = ref(false)
const editing = ref<ServerSummary | null>(null)
const form = reactive({
  name: '',
  type: '',
  host: '',
  port: '25565',
  description: '',
  metaText: '',
})
const saving = ref(false)

const tokenOpen = ref(false)
const tokenValue = ref('')

const deleteOpen = ref(false)
const deleteTarget = ref<ServerSummary | null>(null)
const deleting = ref(false)

async function load() {
  pending.value = true
  try {
    const r = await useApi<{ items: ServerSummary[] }>('/api/servers')
    servers.value = r.items
  } finally { pending.value = false }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.type = 'mc-java'
  form.host = ''
  form.port = '25565'
  form.description = ''
  form.metaText = ''
  formOpen.value = true
}

function openEdit(s: ServerSummary) {
  editing.value = s
  form.name = s.name
  form.type = s.type
  form.host = s.host
  form.port = String(s.port)
  form.description = (s as ServerSummary & { description?: string }).description || ''
  form.metaText = s.meta ? JSON.stringify(s.meta, null, 2) : ''
  formOpen.value = true
}

async function submitForm() {
  let meta: unknown = undefined
  if (form.metaText.trim()) {
    try { meta = JSON.parse(form.metaText) } catch {
      toast.error('Invalid JSON in meta')
      return
    }
  }
  const body: Record<string, unknown> = {
    name: form.name,
    type: form.type,
    host: form.host,
    port: Number(form.port),
    description: form.description,
    meta,
  }
  saving.value = true
  try {
    if (editing.value) {
      await useApi(`/api/admin/servers/${editing.value.id}`, { method: 'PATCH', body })
      toast.success(t('actions.save'))
    } else {
      const r = await useApi<{ id: number, token: string }>('/api/admin/servers', { method: 'POST', body })
      tokenValue.value = r.token
      tokenOpen.value = true
    }
    formOpen.value = false
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    saving.value = false
  }
}

async function resetToken(s: ServerSummary) {
  try {
    const r = await useApi<{ token: string }>(`/api/admin/servers/${s.id}/token/reset`, { method: 'POST' })
    tokenValue.value = r.token
    tokenOpen.value = true
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  }
}

function askDelete(s: ServerSummary) {
  deleteTarget.value = s
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await useApi(`/api/admin/servers/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.success(t('actions.delete'))
    deleteOpen.value = false
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(tokenValue.value)
    toast.success(t('actions.copied'))
  } catch { /* ignore */ }
}

onMounted(load)
</script>
