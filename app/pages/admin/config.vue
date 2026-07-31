<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl mb-6">{{ $t('admin.config') }}</h1>

    <UiCard padded>
      <div v-if="loading" class="space-y-3">
        <UiSkeleton v-for="i in 5" :key="i" :height="40" />
      </div>
      <div v-else class="space-y-3">
        <div v-for="key in keys" :key="key" class="flex items-center gap-3">
          <label class="w-48 text-sm font-mono text-text-secondary truncate" :title="key">{{ key }}</label>
          <UiInput v-model="values[key]" />
          <UiButton size="sm" variant="ghost" class="text-danger" @click="removeKey(key)">
            <LucideTrash2 :size="14" />
          </UiButton>
        </div>

        <div class="flex items-center gap-3 mt-4 pt-4 border-t border-border-subtle">
          <UiInput v-model="newKey" placeholder="new_key" />
          <UiInput v-model="newValue" placeholder="value" />
          <UiButton size="sm" variant="secondary" @click="addKey">
            <template #leading><LucidePlus :size="14" /></template>
            Add
          </UiButton>
        </div>

        <div class="flex justify-end mt-4">
          <UiButton :loading="saving" @click="save">{{ $t('actions.save') }}</UiButton>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()
const { t } = useI18n()

const values = reactive<Record<string, string>>({})
const loading = ref(true)
const saving = ref(false)
const newKey = ref('')
const newValue = ref('')

const keys = computed(() => Object.keys(values).sort())

async function load() {
  try {
    const r = await useApi<Record<string, string>>('/api/config')
    Object.keys(values).forEach((k) => delete values[k])
    Object.assign(values, r)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally { loading.value = false }
}

function addKey() {
  const k = newKey.value.trim()
  if (!k) return
  values[k] = newValue.value
  newKey.value = ''
  newValue.value = ''
}

function removeKey(k: string) {
  delete values[k]
}

async function save() {
  saving.value = true
  try {
    await useApi('/api/admin/config', { method: 'PATCH', body: { ...values } })
    toast.success(t('actions.save'))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally { saving.value = false }
}

onMounted(load)
</script>
