<template>
  <UiModal
    :open="open"
    :title="title"
    size="xl"
    @update:open="(v) => $emit('update:open', v)"
  >
    <div v-if="!server" class="text-text-tertiary text-sm">—</div>
    <div v-else class="space-y-4">
      <p class="text-xs text-text-tertiary">
        {{ $t('admin.console_hint') }}
      </p>

      <UiTabs v-model="tab" :tabs="tabs">
        <UiTabPanel v-show="tab === 'quick'" value="quick">
          <div v-if="!availableKinds.length" class="text-sm text-text-tertiary">
            {{ $t('admin.cmd_unavailable_for_type', { type: typeLabel(server.type) }) }}
          </div>
          <div v-else class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <UiButton
                v-for="k in QUICK_KINDS"
                :key="k"
                :variant="selectedKind === k ? 'primary' : 'ghost'"
                :disabled="!availableKinds.includes(k)"
                size="sm"
                @click="selectKind(k)"
              >
                {{ $t(`admin.cmd_kind.${k}`) }}
              </UiButton>
            </div>

            <div v-if="selectedKind" class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <UiField :label="$t('admin.console_target')" class="md:col-span-2">
                <div class="relative">
                  <UiInput
                    v-model="targetInput"
                    :placeholder="$t('admin.console_target_ph')"
                    autocomplete="off"
                    @focus="suggestOpen = true"
                    @blur="closeSuggestSoon"
                  />
                  <div
                    v-if="suggestOpen && filteredPlayers.length"
                    class="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-md border border-border-default bg-bg-elevated shadow-lg"
                  >
                    <button
                      v-for="p in filteredPlayers"
                      :key="p"
                      type="button"
                      class="block w-full text-left px-3 py-1.5 text-sm hover:bg-bg-hover"
                      @mousedown.prevent="pickPlayer(p)"
                    >
                      {{ p }}
                    </button>
                  </div>
                </div>
              </UiField>

              <UiField :label="$t('admin.console_reason')">
                <UiInput v-model="reasonInput" :placeholder="$t('admin.console_reason_ph')" />
              </UiField>

              <div class="md:col-span-3 flex justify-end">
                <UiButton :loading="running" :disabled="!canSubmitQuick" @click="runQuick">
                  {{ $t('admin.console_run') }}
                </UiButton>
              </div>
            </div>
          </div>
        </UiTabPanel>

        <UiTabPanel v-show="tab === 'raw'" value="raw">
          <div v-if="!availableKinds.includes('raw')" class="text-sm text-text-tertiary">
            {{ $t('admin.cmd_unavailable_for_type', { type: typeLabel(server.type) }) }}
          </div>
          <div v-else class="space-y-3">
            <UiField :label="$t('admin.console_raw')">
              <UiTextarea v-model="rawInput" :rows="2" :placeholder="$t('admin.console_raw_ph')" />
              <p class="text-xs text-text-tertiary mt-1">{{ $t('admin.console_raw_hint') }}</p>
            </UiField>
            <div class="flex justify-end">
              <UiButton :loading="running" :disabled="!rawInput.trim()" @click="runRaw">
                {{ $t('admin.console_run') }}
              </UiButton>
            </div>
          </div>
        </UiTabPanel>
      </UiTabs>

      <section>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-text-secondary">{{ $t('admin.console_output') }}</h3>
          <button
            v-if="history.length"
            type="button"
            class="text-xs text-text-tertiary hover:text-text-primary"
            @click="history = []"
          >
            {{ $t('actions.clear') }}
          </button>
        </div>
        <div
          ref="outputRef"
          class="bg-bg-overlay rounded-md p-3 text-xs font-mono max-h-64 overflow-auto whitespace-pre-wrap"
        >
          <div v-if="!history.length" class="text-text-tertiary">—</div>
          <div v-for="h in history" :key="h.id" class="mb-2 last:mb-0">
            <div class="text-text-tertiary text-[10px] mb-0.5">
              <span :class="h.ok ? 'text-emerald-400' : 'text-danger'">{{ h.ok ? 'ok' : 'fail' }}</span>
              <span class="mx-2">{{ h.time }}</span>
              <span>$ {{ h.cmd }}</span>
            </div>
            <div :class="h.ok ? 'text-text-primary' : 'text-danger'">{{ h.output }}</div>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="$emit('update:open', false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { AdminServerItem, ServerDetail } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  open: boolean
  server: AdminServerItem | null
}>()
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const { t } = useI18n()
const toast = useToast()
const typeLabel = useServerTypeLabel()

const tab = ref('quick')
const tabs = computed(() => [
  { value: 'quick', label: t('admin.console_quick') },
  { value: 'raw', label: t('admin.console_raw') },
])

const QUICK_KINDS = ['kick', 'ban', 'whitelist_add', 'whitelist_remove'] as const
type QuickKind = typeof QUICK_KINDS[number]

// Loaded from /api/admin/servers/:id/command/kinds — the source of truth on
// which buttons should be enabled. Filtering by type on the client alone would
// duplicate the server-side allowlist, which is the one core actually enforces.
const availableKinds = ref<string[]>([])
const onlinePlayers = ref<string[]>([])

const selectedKind = ref<QuickKind | ''>('')
const targetInput = ref('')
const reasonInput = ref('')
const rawInput = ref('')
const suggestOpen = ref(false)
const running = ref(false)

const title = computed(() => props.server ? `${t('admin.console_title')} — ${props.server.name}` : t('admin.console_title'))

const filteredPlayers = computed(() => {
  const q = targetInput.value.trim().toLowerCase()
  const list = onlinePlayers.value
  if (!q) return list.slice(0, 20)
  return list.filter(p => p.toLowerCase().includes(q)).slice(0, 20)
})

const canSubmitQuick = computed(() => !!selectedKind.value && !!targetInput.value.trim())

interface HistEntry { id: number, time: string, cmd: string, ok: boolean, output: string }
const history = ref<HistEntry[]>([])
let histId = 0
const outputRef = ref<HTMLElement | null>(null)

function selectKind(k: string) {
  if (!availableKinds.value.includes(k)) return
  selectedKind.value = k as QuickKind
}

function pickPlayer(name: string) {
  targetInput.value = name
  suggestOpen.value = false
}

function closeSuggestSoon() {
  // Defer close so a mousedown on the suggestion list lands first.
  setTimeout(() => { suggestOpen.value = false }, 120)
}

async function refresh() {
  if (!props.server) return
  const sid = props.server.id
  availableKinds.value = []
  onlinePlayers.value = []
  try {
    const r = await useApi<{ kinds: string[] }>(`/api/admin/servers/${sid}/command/kinds`)
    availableKinds.value = r.kinds || []
  } catch { /* ignore */ }
  try {
    // PublicDetail returns players[] from the heartbeat-fed status cache.
    const d = await useApi<ServerDetail>(`/api/servers/${sid}`)
    onlinePlayers.value = Array.isArray(d.players) ? d.players : []
  } catch { /* ignore */ }
}

watch(() => props.open, (v) => {
  if (v) {
    selectedKind.value = ''
    targetInput.value = ''
    reasonInput.value = ''
    rawInput.value = ''
    history.value = []
    refresh()
  }
})

async function runCommand(body: { kind: string, target?: string, reason?: string, raw?: string }, displayCmd: string) {
  if (!props.server) return
  running.value = true
  try {
    const r = await useApi<{ ok: boolean, output: string, error?: string }>(
      `/api/admin/servers/${props.server.id}/command`,
      { method: 'POST', body },
    )
    pushHistory(displayCmd, r.ok, r.output || r.error || '')
  } catch (e) {
    if (e instanceof ApiError) {
      toast.fromError(e)
      pushHistory(displayCmd, false, e.message)
    }
  } finally {
    running.value = false
  }
}

function pushHistory(cmd: string, ok: boolean, output: string) {
  history.value.push({
    id: ++histId,
    time: new Date().toLocaleTimeString(),
    cmd,
    ok,
    output,
  })
  nextTick(() => {
    if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight
  })
}

function runQuick() {
  if (!selectedKind.value || !targetInput.value.trim()) return
  const kind = selectedKind.value
  const target = targetInput.value.trim()
  const reason = reasonInput.value.trim()
  runCommand(
    { kind, target, ...(reason ? { reason } : {}) },
    `${kind} ${target}${reason ? ` (${reason})` : ''}`,
  )
}

function runRaw() {
  const raw = rawInput.value.trim()
  if (!raw) return
  runCommand({ kind: 'raw', raw }, raw)
}
</script>
