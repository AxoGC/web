<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12 max-w-2xl">
    <h1 class="text-2xl mb-6">{{ $t('nav.settings') }}</h1>

    <UiCard padded class="mb-6">
      <h2 class="text-lg mb-4">{{ $t('me.edit_profile') }}</h2>

      <UiField :label="$t('me.avatar')">
        <!-- Square preview; instant upload on file select. -->
        <div class="w-28">
          <UiImageUpload
            :file="null"
            :preview-url="avatarPreview"
            :max-size-mb="5"
            aspect-ratio="1 / 1"
            :allow-clear="false"
            :placeholder="$t('me.avatar_hint')"
            :alt="auth.user?.username || ''"
            @update:file="onPickAvatar"
          />
          <p v-if="uploading" class="text-sm text-text-secondary mt-2">{{ $t('me.avatar_uploading') }}</p>
          <UiButton
            v-else-if="hasUploadedAvatar"
            variant="ghost"
            size="sm"
            class="mt-2"
            :disabled="uploading"
            @click="removeAvatar"
          >
            {{ $t('me.avatar_remove') }}
          </UiButton>
        </div>
      </UiField>

      <UiField :label="$t('me.background')">
        <!-- Wider preview (16:9-ish) — this is the profile-card banner,
             not a square crop. -->
        <div class="w-56">
          <UiImageUpload
            :file="null"
            :preview-url="backgroundPreview"
            :max-size-mb="5"
            aspect-ratio="16 / 9"
            :allow-clear="false"
            :placeholder="$t('me.background_hint')"
            :alt="auth.user?.username || ''"
            @update:file="onPickBackground"
          />
          <p v-if="uploadingBg" class="text-sm text-text-secondary mt-2">{{ $t('me.background_uploading') }}</p>
          <UiButton
            v-else-if="hasBackground"
            variant="ghost"
            size="sm"
            class="mt-2"
            :disabled="uploadingBg"
            @click="removeBackground"
          >
            {{ $t('me.background_remove') }}
          </UiButton>
        </div>
      </UiField>

      <UiField
        :label="$t('me.username')"
        :help="usernameCooldownActive
          ? $t('me.username_cooldown_active', { date: formatDate(Math.floor((usernameNextAvailableAt ?? 0) / 1000)) })
          : $t('me.username_hint')"
      >
        <div class="flex gap-2">
          <UiInput v-model="newUsername" :placeholder="$t('me.username_placeholder')" class="flex-1" />
          <UiButton
            variant="secondary"
            :loading="renaming"
            :disabled="!newUsername.trim() || newUsername.trim() === auth.user?.username || usernameCooldownActive"
            @click="renameUsername"
          >
            {{ $t('me.username_change') }}
          </UiButton>
        </div>
      </UiField>

      <UiField :label="$t('me.bio')" :error="bioErr">
        <UiTextarea v-model="bio" :rows="3" :invalid="!!bioErr" />
      </UiField>

      <UiField :label="$t('me.city')" :help="$t('me.city_hint')">
        <div class="flex flex-col sm:flex-row gap-2">
          <UiSelect v-model="selectedProvince" :options="provinceOptions" class="sm:w-44" />
          <UiSelect
            v-if="selectedProvince"
            v-model="selectedCityCode"
            :options="citiesInProvince"
            class="w-full sm:flex-1"
          />
        </div>
      </UiField>

      <div class="flex justify-end">
        <UiButton :loading="saving" @click="save">{{ $t('actions.save') }}</UiButton>
      </div>
    </UiCard>

    <UiCard padded class="mb-6">
      <h2 class="text-lg mb-4">{{ $t('me.appearance') }}</h2>
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="m in (['system', 'light', 'dark'] as const)"
          :key="m"
          :variant="theme.mode.value === m ? 'primary' : 'secondary'"
          size="sm"
          @click="theme.set(m)"
        >
          {{ $t(`theme.${m}`) }}
        </UiButton>
      </div>
    </UiCard>

    <UiCard padded>
      <h2 class="text-lg mb-4">{{ $t('me.language') }}</h2>
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="l in (locales as Array<{ code: string, name: string }>)"
          :key="l.code"
          :variant="currentLocale === l.code ? 'primary' : 'secondary'"
          size="sm"
          @click="switchLocale(l.code)"
        >
          {{ l.name || l.code }}
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTheme } from '~/composables/useTheme'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { useCityCoords, type CityCoord } from '~/composables/useCityCoords'
import { formatDate } from '~/utils/format'
import type { MeDTO } from '~/stores/auth'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })

const auth = useAuthStore()
const theme = useTheme()
const toast = useToast()
const { t, locales, locale, setLocale } = useI18n()
const currentLocale = computed(() => locale.value)

const bio = ref(auth.user?.bio || '')
const bioErr = ref('')
const saving = ref(false)
const uploading = ref(false)

// Mirrors user.UsernameRenameCooldown (core) — display-only; the backend is
// the actual authority and re-validates the cooldown server-side.
const usernameRenameCooldownMs = 24 * 60 * 60 * 1000
const newUsername = ref('')
const renaming = ref(false)

const usernameNextAvailableAt = computed(() => {
  const at = auth.user?.username_renamed_at
  return at ? at * 1000 + usernameRenameCooldownMs : null
})
const usernameCooldownActive = computed(() => {
  const next = usernameNextAvailableAt.value
  return !!next && next > Date.now()
})

// Avatar URL from backend always points at /media/users/<id>?v=<unix>; when
// avatar_at is null, ?v=0 → backend serves namespace default. So a non-zero
// ?v= is the signal that the user actually has their own avatar.
const hasUploadedAvatar = computed(() => {
  const url = auth.user?.avatar || ''
  const m = /[?&]v=(\d+)/.exec(url)
  return !!m && m[1] !== '0'
})

const avatarPreview = computed(() => auth.user?.avatar || '')

// Background uses a present/absent string (unlike avatar's "always-a-URL with
// a namespace default"), so the empty-string check is sufficient.
const backgroundPreview = computed(() => auth.user?.background || '')
const hasBackground = computed(() => !!auth.user?.background)
const uploadingBg = ref(false)

// Two-level province -> city cascade. city-coords.json already carries each
// city's province, so the province grouping is derived here rather than
// maintained as a second static file.
const cityCoords = ref<Record<string, CityCoord>>({})
const selectedProvince = ref('')
const selectedCityCode = ref('')

const provinceOptions = computed(() => {
  const provinces = new Set(Object.values(cityCoords.value).map(c => c.province))
  const opts = [{ value: '', label: t('me.city_not_public') }]
  for (const p of [...provinces].sort((a, b) => a.localeCompare(b, 'zh'))) {
    opts.push({ value: p, label: p })
  }
  return opts
})

const citiesInProvince = computed(() => {
  if (!selectedProvince.value) return []
  return Object.entries(cityCoords.value)
    .filter(([, c]) => c.province === selectedProvince.value)
    .map(([code, c]) => ({ value: code, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh'))
})

// Changing province invalidates a city that belonged to the old one — fall
// back to the first city in the new province so the fields never disagree.
watch(selectedProvince, () => {
  if (!selectedProvince.value) {
    selectedCityCode.value = ''
    return
  }
  if (!citiesInProvince.value.some(o => o.value === selectedCityCode.value)) {
    selectedCityCode.value = citiesInProvince.value[0]?.value || ''
  }
})

function applyCityCode(code: string | undefined) {
  const c = code ? cityCoords.value[code] : undefined
  selectedProvince.value = c?.province || ''
  selectedCityCode.value = c ? code! : ''
}

onMounted(async () => {
  cityCoords.value = await useCityCoords().load()
  applyCityCode(auth.user?.city_code)
})

watch(() => auth.user, (u) => {
  if (u) {
    bio.value = u.bio
    applyCityCode(u.city_code)
  }
})

async function onPickAvatar(file: File | null) {
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    const u = await useApi<MeDTO>('/api/users/me/avatar', { method: 'POST', form: fd })
    auth.setUser(u)
    toast.success(t('actions.save'))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    uploading.value = false
  }
}

async function onPickBackground(file: File | null) {
  if (!file) return
  uploadingBg.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    const u = await useApi<MeDTO>('/api/users/me/background', { method: 'POST', form: fd })
    auth.setUser(u)
    toast.success(t('actions.save'))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    uploadingBg.value = false
  }
}

async function removeBackground() {
  if (!confirm(t('me.background_remove_confirm'))) return
  uploadingBg.value = true
  try {
    const u = await useApi<MeDTO>('/api/users/me/background', { method: 'DELETE' })
    auth.setUser(u)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    uploadingBg.value = false
  }
}

async function removeAvatar() {
  if (!confirm(t('me.avatar_remove_confirm'))) return
  uploading.value = true
  try {
    const u = await useApi<MeDTO>('/api/users/me/avatar', { method: 'DELETE' })
    auth.setUser(u)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    uploading.value = false
  }
}

async function renameUsername() {
  const name = newUsername.value.trim()
  if (!name || name === auth.user?.username) return
  if (!confirm(t('me.username_confirm', { name }))) return
  renaming.value = true
  try {
    const u = await useApi<MeDTO>('/api/users/me/username', {
      method: 'POST',
      body: { username: name },
    })
    auth.setUser(u)
    newUsername.value = ''
    toast.success(t('me.username_changed'))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    renaming.value = false
  }
}

async function save() {
  bioErr.value = ''
  if (bio.value.length > 500) {
    bioErr.value = t('errors.BIO_TOO_LONG')
    return
  }
  saving.value = true
  try {
    const u = await useApi<MeDTO>('/api/users/me', {
      method: 'PATCH',
      body: { bio: bio.value, city_code: selectedCityCode.value },
    })
    auth.setUser(u)
    toast.success(t('actions.save'))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    saving.value = false
  }
}

async function switchLocale(code: string) {
  await setLocale(code as never)
}
</script>
