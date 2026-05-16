<template>
  <!-- Polymorphic admin connect-form. Emits the meta-partial that owns the
       game-specific connection payload; the parent merges it into form.meta. -->
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

    <!-- Endpoint-based games -->
    <template v-else>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { DstMeta, ServerEndpoint, ServerType } from '~/types/api'

const props = defineProps<{
  type: ServerType
  /** Initial connection payload extracted from server.meta (for edit mode). */
  initial: Record<string, unknown> | null
}>()

/** Emits the connection-related meta fields. Parent merges these into the full meta. */
const emit = defineEmits<{ (e: 'update:connect', payload: Record<string, unknown>): void }>()

const { t } = useI18n()
const defaultPort = computed(() => defaultPortFor(props.type))

const help = computed(() => {
  if (props.type === 'dst') return t('admin.dst_help')
  return t('admin.endpoint_help', { port: defaultPort.value || '—' })
})

// --- Endpoint-based state ---
const endpoints = ref<ServerEndpoint[]>([])
function addEndpoint() { endpoints.value.push({ host: '' }) }
function removeAt(i: number) { endpoints.value.splice(i, 1) }

// --- DST state ---
const dst = reactive<{ find_by_name: string, password_hint: string }>({ find_by_name: '', password_hint: '' })

function hydrate() {
  const m = (props.initial || {}) as Partial<DstMeta> & { endpoints?: ServerEndpoint[] }
  if (props.type === 'dst') {
    dst.find_by_name = m.find_by_name || ''
    dst.password_hint = m.password_hint || ''
    endpoints.value = []
  } else {
    endpoints.value = Array.isArray(m.endpoints)
      ? m.endpoints.map(e => ({ label: e.label, host: e.host, port: e.port }))
      : []
    if (!endpoints.value.length) endpoints.value.push({ host: '' })
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
        }))
      emit('update:connect', clean.length ? { endpoints: clean } : {})
    }
  },
  { immediate: true, deep: true },
)
</script>
