<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t('nav.settings') }}</h1>

    <UiCard padded class="mb-6">
      <h2 class="text-lg font-semibold mb-4">{{ $t('me.edit_profile') }}</h2>
      <UiField :label="$t('me.avatar')">
        <UiInput v-model="avatar" placeholder="https://…" />
      </UiField>
      <UiField :label="$t('me.bio')" :error="bioErr">
        <UiTextarea v-model="bio" :rows="3" :invalid="!!bioErr" />
      </UiField>
      <div class="flex justify-end">
        <UiButton :loading="saving" @click="save">{{ $t('actions.save') }}</UiButton>
      </div>
    </UiCard>

    <UiCard padded class="mb-6">
      <h2 class="text-lg font-semibold mb-4">{{ $t('me.appearance') }}</h2>
      <div class="flex gap-2">
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
      <h2 class="text-lg font-semibold mb-4">{{ $t('me.language') }}</h2>
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
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTheme } from '~/composables/useTheme'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import type { MeDTO } from '~/stores/auth'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })

const auth = useAuthStore()
const theme = useTheme()
const toast = useToast()
const { t, locales, locale, setLocale } = useI18n()
const currentLocale = computed(() => locale.value)

const avatar = ref(auth.user?.avatar || '')
const bio = ref(auth.user?.bio || '')
const bioErr = ref('')
const saving = ref(false)

watch(() => auth.user, (u) => {
  if (u) {
    avatar.value = u.avatar
    bio.value = u.bio
  }
})

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
      body: { avatar: avatar.value, bio: bio.value },
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
