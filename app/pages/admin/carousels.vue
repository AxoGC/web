<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">{{ $t('admin.carousels') }}</h1>
      <UiButton @click="openCreate">
        <template #leading><LucidePlus :size="16" /></template>
        {{ $t('admin.carousel_create') }}
      </UiButton>
    </header>

    <UiTable v-if="pending || items.length > 0">
      <template #head>
        <tr>
          <th class="text-left px-4 py-2 w-24">{{ $t('admin.carousel_image') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.carousel_caption') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.carousel_link') }}</th>
          <th class="text-left px-4 py-2 w-24">{{ $t('admin.carousel_form_sort') }}</th>
          <th class="text-left px-4 py-2 w-24">{{ $t('admin.carousel_form_active') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 3" :key="i" class="border-t border-border-subtle">
          <td colspan="6" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="c in items" :key="c.id" class="border-t border-border-subtle">
          <td class="px-4 py-2">
            <img
              :src="c.image_url"
              :alt="c.caption"
              class="w-16 h-10 rounded object-cover bg-bg-overlay"
              loading="lazy"
            >
          </td>
          <td class="px-4 py-2 max-w-[24rem]">
            <p class="truncate text-text-primary">{{ c.caption || '—' }}</p>
          </td>
          <td class="px-4 py-2 max-w-[20rem]">
            <a
              v-if="c.link_url"
              :href="c.link_url"
              target="_blank"
              rel="noopener"
              class="text-brand-400 hover:text-brand-500 truncate inline-block max-w-full font-mono text-xs"
            >
              {{ c.link_url }}
            </a>
            <span v-else class="text-text-tertiary">—</span>
          </td>
          <td class="px-4 py-2 text-text-secondary">{{ c.sort }}</td>
          <td class="px-4 py-2">
            <label class="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="c.active"
                :disabled="busyId === c.id"
                class="accent-brand-500 w-4 h-4"
                @change="toggleActive(c, ($event.target as HTMLInputElement).checked)"
              >
            </label>
          </td>
          <td class="px-4 py-2 text-right">
            <UiButton size="sm" variant="ghost" @click="openEdit(c)">{{ $t('actions.edit') }}</UiButton>
            <UiButton size="sm" variant="ghost" class="text-danger" @click="askDelete(c)">
              {{ $t('actions.delete') }}
            </UiButton>
          </td>
        </tr>
      </template>
    </UiTable>
    <UiEmpty v-else :message="$t('admin.carousel_empty')" />

    <UiModal
      :open="formOpen"
      :title="editing ? $t('actions.edit') : $t('admin.carousel_create')"
      @update:open="formOpen = $event"
    >
      <div class="space-y-3">
        <UiField :label="$t('admin.carousel_form_image')" :required="!editing">
          <UiImageUpload
            v-model:file="form.image"
            :preview-url="editing?.image_url"
            :max-size-mb="5"
            :hint="$t('admin.carousel_form_image_hint')"
          />
        </UiField>
        <UiField :label="$t('admin.carousel_form_caption')">
          <UiTextarea
            v-model="form.caption"
            :rows="2"
            :placeholder="$t('admin.carousel_form_caption_ph')"
          />
        </UiField>
        <UiField :label="$t('admin.carousel_form_link')">
          <UiInput v-model="form.link_url" :placeholder="$t('admin.carousel_form_link_ph')" />
        </UiField>
        <div class="grid grid-cols-2 gap-3">
          <UiField :label="$t('admin.carousel_form_sort')">
            <UiInput v-model.number="form.sort" type="number" />
            <p class="text-xs text-text-tertiary mt-1">{{ $t('admin.carousel_form_sort_hint') }}</p>
          </UiField>
          <UiField :label="$t('admin.carousel_form_active')">
            <label class="inline-flex items-center gap-2 mt-2 cursor-pointer">
              <input v-model="form.active" type="checkbox" class="accent-brand-500 w-4 h-4">
              <span class="text-sm">{{ form.active ? $t('common.yes') : $t('common.no') }}</span>
            </label>
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
      :message="$t('admin.carousel_delete_confirm')"
      variant="danger"
      :loading="deleting"
      @update:open="deleteOpen = $event"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { Carousel } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })

const { t } = useI18n()
const toast = useToast()

const items = ref<Carousel[]>([])
const pending = ref(false)
const busyId = ref<number | null>(null)

const formOpen = ref(false)
const editing = ref<Carousel | null>(null)
const form = reactive<{
  image: File | null
  caption: string
  link_url: string
  sort: number
  active: boolean
}>({ image: null, caption: '', link_url: '', sort: 0, active: true })
const saving = ref(false)

const deleteOpen = ref(false)
const deleteTarget = ref<Carousel | null>(null)
const deleting = ref(false)

async function load() {
  pending.value = true
  try {
    const r = await useApi<{ items: Carousel[] }>('/api/admin/carousels')
    items.value = r.items
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    pending.value = false
  }
}

function openCreate() {
  editing.value = null
  form.image = null
  form.caption = ''
  form.link_url = ''
  form.sort = items.value.length > 0 ? Math.max(...items.value.map((c) => c.sort)) + 10 : 0
  form.active = true
  formOpen.value = true
}

function openEdit(c: Carousel) {
  editing.value = c
  form.image = null
  form.caption = c.caption
  form.link_url = c.link_url
  form.sort = c.sort
  form.active = c.active
  formOpen.value = true
}

async function submitForm() {
  if (!editing.value && !form.image) {
    toast.fromError(new ApiError('CAROUSEL_IMAGE_REQUIRED'))
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    if (form.image) fd.append('image', form.image)
    fd.append('caption', form.caption)
    fd.append('link_url', form.link_url)
    fd.append('sort', String(form.sort))
    fd.append('active', form.active ? 'true' : 'false')

    if (editing.value) {
      await useApi(`/api/admin/carousels/${editing.value.id}`, { method: 'PATCH', form: fd })
    } else {
      await useApi('/api/admin/carousels', { method: 'POST', form: fd })
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

async function toggleActive(c: Carousel, next: boolean) {
  busyId.value = c.id
  try {
    const fd = new FormData()
    fd.append('active', next ? 'true' : 'false')
    await useApi(`/api/admin/carousels/${c.id}`, { method: 'PATCH', form: fd })
    c.active = next
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busyId.value = null
  }
}

function askDelete(c: Carousel) {
  deleteTarget.value = c
  deleteOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await useApi(`/api/admin/carousels/${deleteTarget.value.id}`, { method: 'DELETE' })
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
