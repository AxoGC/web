<template>
  <!-- Unified join-method list editor. Each row is fully self-describing (its
       own `type` select decides which fields apply) — nothing here branches
       on the server's own `type`/`alsoBedrock`, so any server can list any
       mix of join methods. -->
  <div class="space-y-2">
    <p class="text-xs text-text-tertiary">{{ $t('admin.method_help') }}</p>

    <div v-for="(row, i) in rows" :key="i" class="border border-border-subtle rounded-md p-2 space-y-2">
      <div class="grid grid-cols-12 gap-2 items-end">
        <UiField class="col-span-3" :label="$t('admin.method_type')">
          <UiSelect v-model="row.type" :options="methodTypeOptions" size="sm" />
        </UiField>
        <UiField class="col-span-8" :label="$t('admin.endpoint_label')">
          <UiInput v-model="row.label" :placeholder="$t('admin.endpoint_label_ph')" />
        </UiField>
        <div class="col-span-1 pb-1 flex justify-end">
          <UiButton variant="ghost" size="sm" @click="removeAt(i)">
            <LucideX :size="14" />
          </UiButton>
        </div>
      </div>

      <!-- mcje / sv: single free-text address, exactly as a player pastes it. -->
      <UiField v-if="row.type === 'mcje' || row.type === 'sv'" :label="$t('admin.method_address')" required>
        <UiInput v-model="row.address" placeholder="play.example.com:25565" />
      </UiField>

      <!-- mcbe / terraria: separate host + port fields. -->
      <div v-else-if="row.type === 'mcbe' || row.type === 'terraria'" class="grid grid-cols-12 gap-2">
        <UiField class="col-span-8" :label="$t('admin.endpoint_host')" required>
          <UiInput v-model="row.host" placeholder="play.example.com" />
        </UiField>
        <UiField class="col-span-4" :label="$t('admin.endpoint_port')" required>
          <UiInput v-model.number="row.port" type="number" :placeholder="String(portPlaceholder(row.type))" />
        </UiField>
      </div>

      <!-- dst: no host:port — search name + console command + optional password hint. -->
      <template v-else-if="row.type === 'dst'">
        <UiField :label="$t('admin.dst_find_by_name')" required>
          <UiInput v-model="row.name" />
        </UiField>
        <UiField :label="$t('admin.dst_command')">
          <UiInput v-model="row.command" placeholder="c_connect(...)" />
        </UiField>
        <UiField :label="$t('admin.dst_password')">
          <UiInput v-model="row.password" />
        </UiField>
      </template>
    </div>

    <UiButton variant="ghost" size="sm" @click="addRow">
      <template #leading><LucidePlus :size="14" /></template>
      {{ $t('admin.endpoint_add') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ServerJoinMethod, ServerType } from '~/types/api'
import { defaultPortForMethod } from '~/composables/useServerConnect'

const props = defineProps<{
  /** Server's primary game type — only used to pick a sensible default `type` for new/first rows. */
  type: ServerType
  /** Initial connection payload extracted from server.meta (for edit mode): `{ join_methods: [...] }`. */
  initial: Record<string, unknown> | null
}>()

/** Emits `{ join_methods: ServerJoinMethod[] }` (or `{}` when the list is empty). Parent merges into form.meta. */
const emit = defineEmits<{ (e: 'update:connect', payload: Record<string, unknown>): void }>()

const { t } = useI18n()

const methodTypeOptions = computed(() => [
  { value: 'mcje', label: t('admin.method_type_mcje') },
  { value: 'mcbe', label: t('admin.method_type_mcbe') },
  { value: 'dst', label: t('admin.method_type_dst') },
  { value: 'terraria', label: t('admin.method_type_terraria') },
  { value: 'sv', label: t('admin.method_type_sv') },
])

function portPlaceholder(methodType: 'mcbe' | 'terraria'): number {
  return defaultPortForMethod(methodType)
}

// Flat draft shape — a superset of every variant's fields, so the template
// can bind uniformly and only the fields relevant to `row.type` get read
// back out when building the clean typed union at emit time.
interface MethodDraft {
  type: ServerJoinMethod['type']
  label: string
  address: string
  host: string
  port: number | undefined
  name: string
  command: string
  password: string
}

function defaultTypeFor(serverType: ServerType): ServerJoinMethod['type'] {
  if (serverType === 'mc-java') return 'mcje'
  if (serverType === 'mc-bedrock') return 'mcbe'
  if (serverType === 'dst') return 'dst'
  if (serverType === 'terraria') return 'terraria'
  return 'sv'
}

function emptyRow(type: ServerJoinMethod['type']): MethodDraft {
  return {
    type,
    label: '',
    address: '',
    host: '',
    port: type === 'mcbe' || type === 'terraria' ? defaultPortForMethod(type) : undefined,
    name: '',
    command: '',
    password: '',
  }
}

function toDraft(m: ServerJoinMethod): MethodDraft {
  const base = emptyRow(m.type)
  base.label = m.label || ''
  switch (m.type) {
    case 'mcje':
    case 'sv':
      base.address = m.address
      break
    case 'mcbe':
    case 'terraria':
      base.host = m.host
      base.port = m.port
      break
    case 'dst':
      base.name = m.name
      base.command = m.command
      base.password = m.password || ''
      break
  }
  return base
}

const rows = ref<MethodDraft[]>([])

function addRow() {
  rows.value.push(emptyRow(defaultTypeFor(props.type)))
}
function removeAt(i: number) {
  rows.value.splice(i, 1)
}

function hydrate() {
  const list = (props.initial as { join_methods?: ServerJoinMethod[] } | null)?.join_methods
  rows.value = Array.isArray(list) ? list.map(toDraft) : []
  if (!rows.value.length) rows.value.push(emptyRow(defaultTypeFor(props.type)))
}
hydrate()
watch(() => props.initial, hydrate)

function buildClean(row: MethodDraft): ServerJoinMethod | null {
  const label = row.label.trim() || undefined
  switch (row.type) {
    case 'mcje':
    case 'sv': {
      const address = row.address.trim()
      if (!address) return null
      return { type: row.type, ...(label ? { label } : {}), address }
    }
    case 'mcbe': {
      const host = row.host.trim()
      if (!host || !row.port) return null
      return { type: 'mcbe', ...(label ? { label } : {}), host, port: Number(row.port) }
    }
    case 'terraria': {
      const host = row.host.trim()
      if (!host || !row.port) return null
      return { type: 'terraria', ...(label ? { label } : {}), host, port: Number(row.port) }
    }
    case 'dst': {
      const name = row.name.trim()
      if (!name) return null
      return { type: 'dst', ...(label ? { label } : {}), name, command: row.command.trim(), ...(row.password.trim() ? { password: row.password.trim() } : {}) }
    }
  }
}

// Emit the connection payload whenever any row changes.
watch(
  () => JSON.stringify(rows.value),
  () => {
    const clean = rows.value.map(buildClean).filter((m): m is ServerJoinMethod => m !== null)
    emit('update:connect', clean.length ? { join_methods: clean } : {})
  },
  { immediate: true, deep: true },
)
</script>
