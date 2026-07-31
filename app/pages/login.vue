<template>
  <UiCard padded>
    <h1 class="text-2xl font-bold mb-1">{{ $t('auth.login_title') }}</h1>
    <p class="text-sm text-text-tertiary mb-6">{{ $t('brand.tagline') }}</p>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <UiField :label="$t('auth.email')" :error="errors.email">
        <UiInput v-model="email" type="email" autocomplete="email" :leading-icon="LucideMail" />
      </UiField>
      <UiField :label="$t('auth.password')" :error="errors.password">
        <UiInput v-model="password" type="password" autocomplete="current-password" :leading-icon="LucideLock" />
      </UiField>

      <p class="text-right text-sm">
        <NuxtLink to="/forgot-password" class="text-brand-400 hover:underline">{{ $t('auth.forgot_password_link') }}</NuxtLink>
      </p>

      <UiButton type="submit" :loading="submitting" block>{{ $t('auth.login_title') }}</UiButton>
    </form>

    <p class="mt-4 text-sm text-text-secondary text-center">
      <NuxtLink to="/register" class="text-brand-400 hover:underline">{{ $t('auth.switch_to_register') }}</NuxtLink>
    </p>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { LucideMail, LucideLock } from '#components'

definePageMeta({ layout: 'auth', ssr: false })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errors = reactive({ email: '', password: '' })

async function onSubmit() {
  errors.email = ''
  errors.password = ''
  if (!/^.+@.+\..+$/.test(email.value)) { errors.email = t('errors.EMAIL_INVALID_FORMAT'); return }
  if (!password.value) { errors.password = t('errors.PASSWORD_TOO_WEAK'); return }
  submitting.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    toast.success(t('auth.logged_in'))
    const redirect = String(route.query.redirect || '/')
    router.replace(redirect)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    submitting.value = false
  }
}
</script>
