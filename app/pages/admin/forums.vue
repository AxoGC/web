<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">{{ $t('admin.forums') }}</h1>
      <UiButton @click="openCreate">
        <template #leading><LucidePlus :size="16" /></template>
        {{ $t('actions.create') }}
      </UiButton>
    </header>

    <UiTable>
      <template #head>
        <tr>
          <th class="text-left px-4 py-2">ID</th>
          <th class="text-left px-4 py-2">{{ $t('admin.forum_form_name') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.forum_form_slug') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.forum_post_count') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.forum_form_sort') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 3" :key="i" class="border-t border-border-subtle">
          <td colspan="6" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="f in forums" :key="f.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary">{{ f.id }}</td>
          <td class="px-4 py-2 font-medium">{{ f.name }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ f.slug }}</td>
          <td class="px-4 py-2">{{ f.post_count }}</td>
          <td class="px-4 py-2 text-text-secondary">{{ f.sort }}</td>
          <td class="px-4 py-2 text-right">
            <UiButton size="sm" variant="ghost" @click="openEdit(f)">{{ $t('actions.edit') }}</UiButton>
            <UiButton size="sm" variant="ghost" class="text-danger" @click="askDelete(f)">
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
          <UiField :label="$t('admin.forum_form_name')" required>
            <UiInput v-model="form.name" />
          </UiField>
          <UiField :label="$t('admin.forum_form_slug')" required>
            <UiInput v-model="form.slug" :disabled="!!editing" placeholder="general" />
            <p v-if="!editing" class="text-xs text-text-tertiary mt-1">
              {{ $t('admin.forum_form_slug_hint') }}
            </p>
          </UiField>
          <UiField class="md:col-span-2" :label="$t('admin.forum_form_description')">
            <UiTextarea v-model="form.description" :rows="2" />
          </UiField>
          <UiField :label="$t('admin.forum_form_icon')">
            <UiInput v-model="form.icon" placeholder="https://…" />
          </UiField>
          <UiField :label="$t('admin.forum_form_banner')">
            <UiInput v-model="form.banner_url" placeholder="https://…" />
          </UiField>
          <UiField :label="$t('admin.forum_form_sort')">
            <UiInput v-model.number="form.sort" type="number" />
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
import { reactive, ref, onMounted } from 'vue'
import type { Forum } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })

const { t } = useI18n()
const toast = useToast()

const forums = ref<Forum[]>([])
const pending = ref(false)

const formOpen = ref(false)
const editing = ref<Forum | null>(null)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  icon: '',
  banner_url: '',
  sort: 0,
})
const saving = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<Forum | null>(null)
const deleting = ref(false)

async function load() {
  pending.value = true
  try {
    const r = await useApi<{ items: Forum[] }>('/api/forums')
    forums.value = r.items
  } finally {
    pending.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.icon = ''
  form.banner_url = ''
  form.sort = 0
  formOpen.value = true
}

function openEdit(f: Forum) {
  editing.value = f
  form.name = f.name
  form.slug = f.slug
  form.description = f.description || ''
  form.icon = f.icon || ''
  form.banner_url = f.banner_url || ''
  form.sort = f.sort ?? 0
  formOpen.value = true
}

async function submitForm() {
  saving.value = true
  try {
    if (editing.value) {
      const body = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        banner_url: form.banner_url,
        sort: Number(form.sort) || 0,
      }
      await useApi(`/api/admin/forums/${editing.value.id}`, { method: 'PATCH', body })
    } else {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        icon: form.icon,
        banner_url: form.banner_url,
        sort: Number(form.sort) || 0,
      }
      await useApi('/api/admin/forums', { method: 'POST', body })
    }
    toast.success(t('actions.save'))
    formOpen.value = false
    await load()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    saving.value = false
  }
}

function askDelete(f: Forum) {
  deleteTarget.value = f
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await useApi(`/api/admin/forums/${deleteTarget.value.id}`, { method: 'DELETE' })
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

onMounted(load)
</script>
