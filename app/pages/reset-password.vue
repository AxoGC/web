<template>
  <UiCard padded>
    <h1 class="text-2xl font-bold mb-1">{{ $t('auth.reset_password_title') }}</h1>
    <p class="text-sm text-text-tertiary mb-6">{{ $t('brand.tagline') }}</p>

    <UiEmpty v-if="!token" :message="$t('auth.reset_password_token_missing')" />

    <template v-else-if="!done">
      <form class="space-y-4" @submit.prevent="onSubmit">
        <UiField :label="$t('auth.password')" :help="$t('auth.rules_password')" :error="errors.password">
          <UiInput v-model="password" type="password" autocomplete="new-password" :leading-icon="LucideLock" />
        </UiField>
        <UiField :label="$t('auth.password_again')" :error="errors.passwordAgain">
          <UiInput v-model="passwordAgain" type="password" autocomplete="new-password" :leading-icon="LucideLock" />
        </UiField>

        <UiButton type="submit" :loading="submitting" block>{{ $t('auth.reset_password_submit') }}</UiButton>
      </form>
    </template>

    <p v-else class="text-sm text-text-secondary">{{ $t('auth.reset_password_success') }}</p>

    <p class="mt-4 text-sm text-text-secondary text-center">
      <NuxtLink to="/login" class="text-brand-400 hover:underline">{{ $t('auth.switch_to_login') }}</NuxtLink>
    </p>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { LucideLock } from '#components'

definePageMeta({ layout: 'auth', ssr: false })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const token = computed(() => String(route.query.token || ''))

const password = ref('')
const passwordAgain = ref('')
const submitting = ref(false)
const done = ref(false)
const errors = reactive({ password: '', passwordAgain: '' })

async function onSubmit() {
  errors.password = ''
  errors.passwordAgain = ''
  if (password.value.length < 8 || !/[a-z]/i.test(password.value) || !/\d/.test(password.value)) {
    errors.password = t('errors.PASSWORD_TOO_WEAK')
    return
  }
  if (passwordAgain.value !== password.value) {
    errors.passwordAgain = t('auth.password_mismatch')
    return
  }
  submitting.value = true
  try {
    await useApi('/api/auth/password/reset', {
      method: 'POST',
      body: { token: token.value, password: password.value },
      anonymous: true,
    })
    done.value = true
    toast.success(t('auth.reset_password_success'))
    setTimeout(() => router.replace('/login'), 2000)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    submitting.value = false
  }
}
</script>
