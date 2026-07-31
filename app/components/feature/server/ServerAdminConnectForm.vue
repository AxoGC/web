<template>
  <!-- Polymorphic admin connect-form. Emits the meta-partial that owns the
       game-specific connection payload; the parent merges it into form.meta.

       Input shape mirrors how players type the address into each game's own
       client: Java / Terraria — single line `host:port`; Bedrock — host and
       port on separate fields; DST — in-game server name. -->
  <div class="space-y-2">
    <p class="text-xs text-text-tertiary">{{ help }}</p>

    <!-- DST: name-based join, no endpoints -->
    <template v-if="type === 'dst'">
      <UiField :label="$t('admin.dst_find_by_name')" required>
        <UiInput v-model="dst.find_by_name" />
      </UiField>
      <UiField :label="$t('admin.dst_password_hint')">
        <UiInput v-model="dst.password_hint" />
      </UiField>
    </template>

    <!-- Bedrock: two separate fields (host / port) — mirrors the MCPE client UI. -->
    <template v-else-if="type === 'mc-bedrock'">
      <div v-for="(ep, i) in endpoints" :key="i" class="grid grid-cols-12 gap-2 items-end">
        <UiField class="col-span-3" :label="$t('admin.endpoint_label')">
          <UiInput v-model="ep.label" :placeholder="$t('admin.endpoint_label_ph')" />
        </UiField>
        <UiField class="col-span-6" :label="$t('admin.endpoint_host')" required>
          <UiInput v-model="ep.host" placeholder="play.example.com" />
        </UiField>
        <UiField class="col-span-2" :label="$t('admin.endpoint_port')">
          <UiInput v-model.number="ep.port" type="number" :placeholder="String(defaultPort ?? '')" />
        </UiField>
        <div class="col-span-1 pb-1">
          <UiButton variant="ghost" size="sm" @click="removeAt(i)">
            <LucideX :size="14" />
          </UiButton>
        </div>
      </div>
      <UiButton variant="ghost" size="sm" @click="addEndpoint">
        <template #leading><LucidePlus :size="14" /></template>
        {{ $t('admin.endpoint_add') }}
      </UiButton>
    </template>

    <!-- Java / Terraria: single-line `host[:port]` — players paste it verbatim. -->
    <template v-else>
      <div v-for="(ep, i) in endpoints" :key="i" class="grid grid-cols-12 gap-2 items-end">
        <UiField class="col-span-3" :label="$t('admin.endpoint_label')">
          <UiInput v-model="ep.label" :placeholder="$t('admin.endpoint_label_ph')" />
        </UiField>
        <UiField :class="alsoBedrock ? 'col-span-5' : 'col-span-8'" :label="$t('admin.endpoint_address')" required>
          <UiInput
            :model-value="endpointInputs[i]"
            :placeholder="`play.example.com:${defaultPort ?? ''}`"
            @update:model-value="onAddressInput(i, $event)"
          />
          <p v-if="addressErrors[i]" class="text-xs text-danger mt-1">{{ addressErrors[i] }}</p>
        </UiField>
        <UiField v-if="alsoBedrock" class="col-span-3" :label="$t('admin.endpoint_type')">
          <UiSelect
            :model-value="ep.type || ''"
            :options="endpointTypeOptions"
            size="sm"
            @update:model-value="v => setEndpointType(ep, v)"
          />
        </UiField>
        <div class="col-span-1 pb-1">
          <UiButton variant="ghost" size="sm" @click="removeAt(i)">
            <LucideX :size="14" />
          </UiButton>
        </div>
      </div>
      <UiButton variant="ghost" size="sm" @click="addEndpoint">
        <template #leading><LucidePlus :size="14" /></template>
        {{ $t('admin.endpoint_add') }}
      </UiButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { DstMeta, ServerEndpoint, ServerType } from '~/types/api'

const props = defineProps<{
  type: ServerType
  /** Initial connection payload extracted from server.meta (for edit mode). */
  initial: Record<string, unknown> | null
  /**
   * Whether this mc-java server is also reachable by Bedrock clients — only
   * then does an endpoint's game matter, since Java-only and hybrid servers
   * both use this same "Java / Terraria" branch of the form.
   */
  alsoBedrock?: boolean
}>()

/** Emits the connection-related meta fields. Parent merges these into the full meta. */
const emit = defineEmits<{ (e: 'update:connect', payload: Record<string, unknown>): void }>()

const { t } = useI18n()
const defaultPort = computed(() => defaultPortFor(props.type))

const help = computed(() => {
  if (props.type === 'dst') return t('admin.dst_help')
  if (props.type === 'mc-bedrock') return t('admin.endpoint_help', { port: defaultPort.value || '—' })
  return t('admin.endpoint_address_help', { port: defaultPort.value || '—' })
})

// "Shared" (no type) means the endpoint is shown under every connect card
// rendered for this server — the only sane default for single-type servers,
// and still the right default when adding a new row on a hybrid one.
const endpointTypeOptions = computed(() => [
  { value: '', label: t('admin.endpoint_type_shared') },
  { value: 'mc-java', label: t('admin.endpoint_type_java') },
  { value: 'mc-bedrock', label: t('admin.endpoint_type_bedrock') },
])

// --- Endpoint-based state ---
// `endpoints` is the canonical structured shape (host + port). For Java /
// Terraria we also keep a side string mirror so users can type `host:port`
// on a single line — the parser drives `endpoints[i]` and we render from the
// mirror so a malformed-but-being-typed value isn't reflected back as the
// truncated parse result.
const endpoints = ref<ServerEndpoint[]>([])
const endpointInputs = ref<string[]>([])
const addressErrors = ref<string[]>([])

function addEndpoint() {
  endpoints.value.push({ host: '' })
  endpointInputs.value.push('')
  addressErrors.value.push('')
}
function removeAt(i: number) {
  endpoints.value.splice(i, 1)
  endpointInputs.value.splice(i, 1)
  addressErrors.value.splice(i, 1)
}
function setEndpointType(ep: ServerEndpoint, v: string | number) {
  ep.type = (v === 'mc-java' || v === 'mc-bedrock') ? v : undefined
}

/**
 * Parse a `host[:port]` string into the structured endpoint. Returns the
 * parsed parts plus an error message on malformed input. Empty string is
 * not an error — it just means the row is blank.
 *
 * Recognised:
 *   host                   → { host }
 *   host:port              → { host, port }
 *   [ipv6]:port            → { host: "ipv6", port }
 *
 * Rejected: trailing `:` with no port, non-numeric port.
 */
function parseAddress(raw: string): { host: string, port?: number, error: string } {
  const s = raw.trim()
  if (!s) return { host: '', error: '' }
  // IPv6 bracketed: [::1]:25577
  const m6 = s.match(/^\[([^\]]+)\](?::(\d+))?$/)
  if (m6) {
    const port = m6[2] ? Number(m6[2]) : undefined
    return { host: m6[1] as string, port, error: '' }
  }
  // host:port — last colon wins. (Plain IPv6 without brackets is rejected to
  // keep the parser predictable; admins can wrap it as [::1].)
  const idx = s.lastIndexOf(':')
  if (idx < 0) return { host: s, error: '' }
  const host = s.slice(0, idx)
  const portStr = s.slice(idx + 1)
  if (!portStr) return { host, error: t('admin.endpoint_address_invalid_port') }
  if (!/^\d+$/.test(portStr)) return { host, error: t('admin.endpoint_address_invalid_port') }
  const port = Number(portStr)
  if (port < 1 || port > 65535) return { host, error: t('admin.endpoint_address_invalid_port') }
  return { host, port, error: '' }
}

function onAddressInput(i: number, val: string) {
  endpointInputs.value[i] = val
  const parsed = parseAddress(val)
  addressErrors.value[i] = parsed.error
  const ep = endpoints.value[i]
  if (!ep) return
  ep.host = parsed.host
  // Distinguish "no port given" (omit field) from "port = 0" (invalid). We
  // drop the port from the structured object when not present so the emitted
  // payload stays clean.
  if (parsed.port !== undefined) {
    ep.port = parsed.port
  } else {
    delete ep.port
  }
}

/** Build the displayed single-line address from a structured endpoint. */
function joinAddress(ep: ServerEndpoint): string {
  if (!ep.host) return ''
  return ep.port ? `${ep.host}:${ep.port}` : ep.host
}

// --- DST state ---
const dst = reactive<{ find_by_name: string, password_hint: string }>({ find_by_name: '', password_hint: '' })

function hydrate() {
  const m = (props.initial || {}) as Partial<DstMeta> & { endpoints?: ServerEndpoint[] }
  if (props.type === 'dst') {
    dst.find_by_name = m.find_by_name || ''
    dst.password_hint = m.password_hint || ''
    endpoints.value = []
    endpointInputs.value = []
    addressErrors.value = []
  } else {
    endpoints.value = Array.isArray(m.endpoints)
      ? m.endpoints.map(e => ({ label: e.label, host: e.host, port: e.port, type: e.type }))
      : []
    if (!endpoints.value.length) endpoints.value.push({ host: '' })
    endpointInputs.value = endpoints.value.map(joinAddress)
    addressErrors.value = endpoints.value.map(() => '')
  }
}
hydrate()
watch(() => props.type, hydrate)
watch(() => props.initial, hydrate)

// Emit the connection payload whenever state changes.
watch(
  () => [props.type, JSON.stringify(endpoints.value), dst.find_by_name, dst.password_hint],
  () => {
    if (props.type === 'dst') {
      const payload: Record<string, unknown> = {}
      if (dst.find_by_name) payload.find_by_name = dst.find_by_name
      if (dst.password_hint) payload.password_hint = dst.password_hint
      emit('update:connect', payload)
    } else {
      const clean = endpoints.value
        .filter(e => e.host && e.host.trim())
        .map(e => ({
          ...(e.label ? { label: e.label } : {}),
          host: e.host.trim(),
          ...(e.port ? { port: Number(e.port) } : {}),
          ...(e.type ? { type: e.type } : {}),
        }))
      emit('update:connect', clean.length ? { endpoints: clean } : {})
    }
  },
  { immediate: true, deep: true },
)
</script>
