<template>
  <div>
    <header class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl">{{ $t('admin.tags') }}</h1>
      <div class="flex items-center gap-3">
        <UiSelect
          v-model="forumId"
          :options="forumOptions"
          :placeholder="$t('nav.forums')"
        />
        <UiButton :disabled="!forumId" @click="openCreate">
          <template #leading><LucidePlus :size="16" /></template>
          {{ $t('actions.create') }}
        </UiButton>
      </div>
    </header>

    <UiCard v-if="!forumId" padded>
      <p class="text-sm text-text-tertiary">{{ $t('admin.tag_pick_forum') }}</p>
    </UiCard>

    <UiTable v-else>
      <template #head>
        <tr>
          <th class="text-left px-4 py-2">ID</th>
          <th class="text-left px-4 py-2">{{ $t('admin.tag_form_preview') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.tag_form_color') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.tag_form_sort') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.tag_post_count') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 3" :key="i" class="border-t border-border-subtle">
          <td colspan="6" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else-if="!tags.length">
        <tr>
          <td colspan="6" class="px-4 py-6 text-center text-text-tertiary">{{ $t('admin.tag_empty') }}</td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="t in tags" :key="t.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary">{{ t.id }}</td>
          <td class="px-4 py-2">
            <UiTag :color="t.color" size="md">{{ t.name }}</UiTag>
          </td>
          <td class="px-4 py-2 font-mono text-xs">{{ t.color }}</td>
          <td class="px-4 py-2 text-text-secondary">{{ t.sort }}</td>
          <td class="px-4 py-2 text-text-secondary">{{ t.post_count }}</td>
          <td class="px-4 py-2 text-right">
            <UiButton size="sm" variant="ghost" @click="openEdit(t)">{{ $t('actions.edit') }}</UiButton>
            <UiButton size="sm" variant="ghost" class="text-danger" @click="askDelete(t)">
              {{ $t('actions.delete') }}
            </UiButton>
          </td>
        </tr>
      </template>
    </UiTable>

    <UiModal
      :open="formOpen"
      :title="editing ? $t('actions.edit') : $t('actions.create')"
      @update:open="formOpen = $event"
    >
      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UiField :label="$t('admin.tag_form_name')" required>
            <UiInput v-model="form.name" :placeholder="$t('admin.tag_form_name')" />
          </UiField>
          <UiField :label="$t('admin.tag_form_color')">
            <div class="flex items-center gap-2">
              <input
                type="color"
                :value="form.color"
                class="h-9 w-9 rounded border border-border-default bg-bg-elevated cursor-pointer"
                @input="form.color = ($event.target as HTMLInputElement).value"
              >
              <UiInput v-model="form.color" placeholder="#3b82f6" class="flex-1" />
            </div>
          </UiField>
          <UiField :label="$t('admin.tag_form_sort')">
            <UiInput v-model.number="form.sort" type="number" />
          </UiField>
          <UiField :label="$t('admin.tag_form_preview')">
            <UiTag :color="form.color || '#3b82f6'" size="md">{{ form.name || $t('admin.tag_form_preview') }}</UiTag>
          </UiField>
        </div>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="formOpen = false">{{ $t('actions.cancel') }}</UiButton>
        <UiButton :loading="saving" @click="submitForm">{{ $t('actions.save') }}</UiButton>
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
import { reactive, ref, computed, watch, onMounted } from 'vue'
import type { Forum } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })

interface AdminTag {
  id: number
  forum_id: number
  name: string
  color: string
  sort: number
  post_count: number
}

const { t } = useI18n()
const toast = useToast()

const forums = ref<Forum[]>([])
const forumId = ref<number | string>('')
const tags = ref<AdminTag[]>([])
const pending = ref(false)

const formOpen = ref(false)
const editing = ref<AdminTag | null>(null)
const form = reactive({
  name: '',
  color: '#3b82f6',
  sort: 0,
})
const saving = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<AdminTag | null>(null)
const deleting = ref(false)

const forumOptions = computed(() =>
  forums.value.map((f) => ({ value: f.id, label: f.name })),
)

async function loadForums() {
  try {
    const r = await useApi<{ items: Forum[] }>('/api/forums')
    forums.value = r.items
    if (!forumId.value && r.items.length) forumId.value = r.items[0].id
  } catch (e) {
    toast.fromError(e)
  }
}

async function loadTags() {
  if (!forumId.value) return
  pending.value = true
  try {
    const r = await useApi<{ items: AdminTag[] }>(`/api/admin/forums/${Number(forumId.value)}/tags`)
    tags.value = r.items
  } catch (e) {
    toast.fromError(e)
  } finally {
    pending.value = false
  }
}

watch(forumId, () => { loadTags() })

function openCreate() {
  editing.value = null
  form.name = ''
  form.color = '#3b82f6'
  form.sort = 0
  formOpen.value = true
}

function openEdit(t: AdminTag) {
  editing.value = t
  form.name = t.name
  form.color = t.color
  form.sort = t.sort
  formOpen.value = true
}

async function submitForm() {
  if (!forumId.value) return
  saving.value = true
  try {
    if (editing.value) {
      await useApi(`/api/admin/tags/${editing.value.id}`, {
        method: 'PATCH',
        body: {
          name: form.name,
          color: form.color || undefined,
          sort: Number(form.sort) || 0,
        },
      })
    } else {
      await useApi(`/api/admin/forums/${Number(forumId.value)}/tags`, {
        method: 'POST',
        body: {
          name: form.name,
          color: form.color || undefined,
          sort: Number(form.sort) || 0,
        },
      })
    }
    toast.success(t('actions.save'))
    formOpen.value = false
    await loadTags()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    saving.value = false
  }
}

function askDelete(t: AdminTag) {
  deleteTarget.value = t
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await useApi(`/api/admin/tags/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.success(t('actions.delete'))
    deleteOpen.value = false
    await loadTags()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}

onMounted(loadForums)
</script>
