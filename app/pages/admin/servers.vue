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
          <th class="text-left px-4 py-2">{{ $t('admin.server_form_connect') }}</th>
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
          <td class="px-4 py-2 font-mono text-xs">{{ connectHint(s) }}</td>
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
      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UiField :label="$t('admin.server_form_name')" required>
            <UiInput v-model="form.name" />
          </UiField>
          <UiField :label="$t('admin.server_form_type')" required>
            <UiSelect v-model="form.type" :options="typeOptions" :disabled="!!editing" />
          </UiField>
          <UiField class="md:col-span-2" :label="$t('admin.server_form_desc')">
            <UiTextarea v-model="form.description" :rows="2" />
          </UiField>
        </div>

        <fieldset class="border border-border-subtle rounded-md p-3">
          <legend class="text-sm font-medium px-1">{{ $t('admin.server_form_connect') }}</legend>
          <ServerAdminConnectForm
            :type="form.type"
            :initial="connectInitial"
            @update:connect="onConnectChange"
          />
        </fieldset>

        <UiField :label="$t('admin.server_form_extra_meta')">
          <UiTextarea v-model="form.extraMetaText" :rows="2" placeholder='{"motd":"…"}' />
          <p class="text-xs text-text-tertiary mt-1">{{ $t('admin.server_form_extra_meta_hint') }}</p>
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
import { ref, reactive, computed, onMounted } from 'vue'
import type { DstMeta, ServerSummary, ServerType } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { extractEndpoints, formatEndpoint } from '~/composables/useServerConnect'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()
const { t } = useI18n()

const servers = ref<ServerSummary[]>([])
const pending = ref(false)

const typeOptions = [
  { value: 'mc-java', label: 'MC Java' },
  { value: 'mc-bedrock', label: 'MC Bedrock' },
  { value: 'dst', label: 'DST' },
  { value: 'terraria', label: 'Terraria' },
]

const formOpen = ref(false)
const editing = ref<ServerSummary | null>(null)
const form = reactive<{
  name: string
  type: ServerType
  description: string
  /** "Other" meta fields the admin wants to override as raw JSON (excluding connection keys). */
  extraMetaText: string
}>({
  name: '',
  type: 'mc-java',
  description: '',
  extraMetaText: '',
})
// Connection payload emitted by the subform (endpoints[] or DST fields).
const connectPayload = ref<Record<string, unknown>>({})
// Initial meta passed into the subform (only its connection keys are read).
const connectInitial = ref<Record<string, unknown> | null>(null)
function onConnectChange(p: Record<string, unknown>) { connectPayload.value = p }

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

/** Human summary of how to connect, shown in the table. */
function connectHint(s: ServerSummary): string {
  if (s.type === 'dst') {
    const n = (s.meta as DstMeta | undefined)?.find_by_name
    return n ? `🔎 ${n}` : '—'
  }
  const eps = extractEndpoints(s)
  if (!eps.length) return '—'
  const first = formatEndpoint(s.type, eps[0]!)
  return eps.length > 1 ? `${first} (+${eps.length - 1})` : first
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.type = 'mc-java'
  form.description = ''
  form.extraMetaText = ''
  connectInitial.value = null
  connectPayload.value = {}
  formOpen.value = true
}

const CONNECT_KEYS = new Set(['endpoints', 'find_by_name', 'password_hint'])

function openEdit(s: ServerSummary) {
  editing.value = s
  form.name = s.name
  form.type = s.type
  form.description = (s as ServerSummary & { description?: string }).description || ''
  const fullMeta = (s.meta || {}) as Record<string, unknown>
  // Split the persisted meta into "connection" vs "extra" so the connect subform
  // owns its fields and the textarea only carries the rest.
  const extra: Record<string, unknown> = {}
  const connect: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fullMeta)) {
    (CONNECT_KEYS.has(k) ? connect : extra)[k] = v
  }
  connectInitial.value = connect
  form.extraMetaText = Object.keys(extra).length ? JSON.stringify(extra, null, 2) : ''
  formOpen.value = true
}

const _typeBoundary = computed(() => form.type)
void _typeBoundary // keep reactive for the subform re-hydration via prop change

async function submitForm() {
  let extra: Record<string, unknown> = {}
  if (form.extraMetaText.trim()) {
    try {
      const parsed = JSON.parse(form.extraMetaText)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        extra = parsed as Record<string, unknown>
      } else {
        toast.error(t('admin.server_form_extra_meta_invalid'))
        return
      }
    } catch {
      toast.error(t('admin.server_form_extra_meta_invalid'))
      return
    }
  }
  // Guardrail: connection-owned keys belong to the subform, not the raw textarea.
  for (const k of Object.keys(extra)) {
    if (CONNECT_KEYS.has(k)) delete extra[k]
  }
  const meta = { ...extra, ...connectPayload.value }

  const body: Record<string, unknown> = {
    name: form.name,
    description: form.description,
    meta,
  }
  if (!editing.value) body.type = form.type

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
