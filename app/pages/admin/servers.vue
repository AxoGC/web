<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl">{{ $t('admin.servers') }}</h1>
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
          <th class="text-left px-4 py-2 w-24">{{ $t('admin.server_form_visible') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 3" :key="i" class="border-t border-border-subtle">
          <td colspan="7" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="s in servers" :key="s.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary">{{ s.id }}</td>
          <td class="px-4 py-2 font-medium">{{ s.name }}</td>
          <td class="px-4 py-2">{{ typeLabel(s.type) }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ connectHint(s) }}</td>
          <td class="px-4 py-2">
            <UiStatusDot :status="s.status">
              <span class="text-text-secondary">{{ s.online }}/{{ s.max }}</span>
            </UiStatusDot>
          </td>
          <td class="px-4 py-2">
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="s.visible"
                :disabled="busyId === s.id"
                class="accent-brand-500 w-4 h-4"
                @change="toggleVisible(s, ($event.target as HTMLInputElement).checked)"
              >
            </label>
          </td>
          <td class="px-4 py-2 text-right">
            <UiButton size="sm" variant="ghost" @click="openEdit(s)">{{ $t('actions.edit') }}</UiButton>
            <UiButton
              size="sm"
              variant="ghost"
              :disabled="!supportsConsole(s.type)"
              @click="openConsole(s)"
            >
              {{ $t('admin.console') }}
            </UiButton>
            <UiButton size="sm" variant="ghost" @click="askResetToken(s)">Token</UiButton>
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
          <UiField :label="$t('admin.server_form_visible')">
            <label class="inline-flex items-center gap-2 mt-2 cursor-pointer">
              <input v-model="form.visible" type="checkbox" class="accent-brand-500 w-4 h-4">
              <span class="text-sm">{{ form.visible ? $t('common.yes') : $t('common.no') }}</span>
            </label>
            <p class="text-xs text-text-tertiary mt-1">{{ $t('admin.server_form_visible_hint') }}</p>
          </UiField>
          <UiField class="md:col-span-2" :label="$t('admin.server_form_desc')">
            <RichEditor v-model="form.description" v-model:attachment-ids="attachmentIds" />
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

        <fieldset class="border border-border-subtle rounded-md p-3">
          <legend class="text-sm font-medium px-1">{{ $t('admin.server_form_extra_meta') }}</legend>
          <ServerAdminMetaPanel
            :type="form.type"
            :model-value="form.metaExtras"
            @update:model-value="form.metaExtras = $event"
          />
        </fieldset>
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

    <UiConfirmModal
      :open="tokenConfirmOpen"
      :title="$t('admin.token_reset_title')"
      :message="$t('admin.token_reset_confirm', { name: tokenTarget?.name })"
      variant="danger"
      :loading="tokenResetting"
      @update:open="tokenConfirmOpen = $event"
      @confirm="doResetToken"
    />

    <ServerAdminConsoleModal
      :open="consoleOpen"
      :server="consoleTarget"
      @update:open="consoleOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { AdminServerItem, DstMeta, ServerType } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { extractEndpoints, formatEndpoint } from '~/composables/useServerConnect'
import { emptyDoc, isEmptyDoc } from '~/utils/tiptap'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()
const { t } = useI18n()
const typeLabel = useServerTypeLabel()

const servers = ref<AdminServerItem[]>([])
const pending = ref(false)

const typeOptions = computed(() => [
  { value: 'mc-java', label: typeLabel('mc-java') },
  { value: 'mc-bedrock', label: typeLabel('mc-bedrock') },
  { value: 'dst', label: typeLabel('dst') },
  { value: 'terraria', label: typeLabel('terraria') },
])

const formOpen = ref(false)
const editing = ref<AdminServerItem | null>(null)
const form = reactive<{
  name: string
  type: ServerType
  // TipTap doc. Stored as-is and submitted as JSON; null when empty.
  description: Record<string, unknown>
  /**
   * Non-connection meta keys. The ServerAdminMetaPanel owns editing via
   * either structured per-type fields or a raw JSON view. On submit it's
   * merged with `connectPayload` to form the persisted Meta.
   */
  metaExtras: Record<string, unknown>
  visible: boolean
}>({
  name: '',
  type: 'mc-java',
  description: emptyDoc(),
  metaExtras: {},
  visible: true,
})
// Draft-upload ids the description editor collected this session; stamped
// to server_id on submit so they don't get orphan-GC'd the way a bare
// embedded URL would be. Reset on every open — ids already attached from a
// prior save don't need resubmitting.
const attachmentIds = ref<number[]>([])
// Connection payload emitted by the subform (endpoints[] or DST fields).
const connectPayload = ref<Record<string, unknown>>({})
// Initial meta passed into the subform (only its connection keys are read).
const connectInitial = ref<Record<string, unknown> | null>(null)
function onConnectChange(p: Record<string, unknown>) { connectPayload.value = p }

const saving = ref(false)

const tokenOpen = ref(false)
const tokenValue = ref('')
const tokenConfirmOpen = ref(false)
const tokenTarget = ref<AdminServerItem | null>(null)
const tokenResetting = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<AdminServerItem | null>(null)
const deleting = ref(false)

const consoleOpen = ref(false)
const consoleTarget = ref<AdminServerItem | null>(null)

const busyId = ref<number | null>(null)

const CONSOLE_SUPPORTED: ReadonlySet<string> = new Set(['mc-java', 'mc-bedrock'])
function supportsConsole(type: string) { return CONSOLE_SUPPORTED.has(type) }

function openConsole(s: AdminServerItem) {
  if (!supportsConsole(s.type)) return
  consoleTarget.value = s
  consoleOpen.value = true
}

async function load() {
  pending.value = true
  try {
    // Admin endpoint preserves description + the `_internal` envelope so the
    // edit form can roundtrip credentials.
    const r = await useApi<{ items: AdminServerItem[] }>('/api/admin/servers')
    servers.value = r.items
  } finally { pending.value = false }
}

/** Human summary of how to connect, shown in the table. */
function connectHint(s: AdminServerItem): string {
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
  form.description = emptyDoc()
  form.metaExtras = {}
  form.visible = true
  connectInitial.value = null
  connectPayload.value = {}
  attachmentIds.value = []
  formOpen.value = true
}

const CONNECT_KEYS = new Set(['endpoints', 'find_by_name', 'password_hint'])

function openEdit(s: AdminServerItem) {
  editing.value = s
  form.name = s.name
  form.type = s.type
  form.visible = s.visible
  form.description = (s.description && !isEmptyDoc(s.description)) ? s.description : emptyDoc()
  const fullMeta = (s.meta || {}) as Record<string, unknown>
  // Split the persisted meta into "connection" vs "extra" so the connect subform
  // owns its fields and the meta-panel only carries the rest.
  const extra: Record<string, unknown> = {}
  const connect: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fullMeta)) {
    (CONNECT_KEYS.has(k) ? connect : extra)[k] = v
  }
  connectInitial.value = connect
  form.metaExtras = extra
  attachmentIds.value = []
  formOpen.value = true
}

const _typeBoundary = computed(() => form.type)
void _typeBoundary // keep reactive for the subform re-hydration via prop change

async function submitForm() {
  // The meta panel guarantees a plain object; we just defensively strip any
  // connection-owned keys an admin may have written via the JSON escape hatch.
  const extra: Record<string, unknown> = { ...(form.metaExtras || {}) }
  for (const k of Object.keys(extra)) {
    if (CONNECT_KEYS.has(k)) delete extra[k]
  }
  const meta = { ...extra, ...connectPayload.value }

  const body: Record<string, unknown> = {
    name: form.name,
    description: isEmptyDoc(form.description) ? null : form.description,
    meta,
    visible: form.visible,
    attachment_ids: attachmentIds.value,
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

function askResetToken(s: AdminServerItem) {
  tokenTarget.value = s
  tokenConfirmOpen.value = true
}

// Rotating the token immediately disconnects the running plugin — admin must
// edit its config + restart with the new value. Gating behind an explicit
// confirm prevents an accidental click on the row's Token button from
// silently breaking the server↔platform bridge.
async function doResetToken() {
  if (!tokenTarget.value) return
  const s = tokenTarget.value
  tokenResetting.value = true
  try {
    const r = await useApi<{ token: string }>(`/api/admin/servers/${s.id}/token/reset`, { method: 'POST' })
    tokenValue.value = r.token
    tokenConfirmOpen.value = false
    tokenOpen.value = true
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    tokenResetting.value = false
    tokenTarget.value = null
  }
}

async function toggleVisible(s: AdminServerItem, next: boolean) {
  busyId.value = s.id
  try {
    await useApi(`/api/admin/servers/${s.id}`, { method: 'PATCH', body: { visible: next } })
    s.visible = next
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busyId.value = null
  }
}

function askDelete(s: AdminServerItem) {
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
