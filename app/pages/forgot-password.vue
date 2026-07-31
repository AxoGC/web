<template>
  <UiCard padded>
    <h1 class="text-2xl mb-1">{{ $t('auth.forgot_password_title') }}</h1>
    <p class="text-sm text-text-tertiary mb-6">{{ $t('auth.forgot_password_hint') }}</p>

    <form v-if="!sent" class="space-y-4" @submit.prevent="onSubmit">
      <UiField :label="$t('auth.email')" :error="errors.email">
        <UiInput v-model="email" type="email" autocomplete="email" :leading-icon="LucideMail" />
      </UiField>

      <UiButton type="submit" :loading="submitting" block>{{ $t('auth.forgot_password_submit') }}</UiButton>
    </form>

    <p v-else class="text-sm text-text-secondary">{{ $t('auth.forgot_password_sent') }}</p>

    <p class="mt-4 text-sm text-text-secondary text-center">
      <NuxtLink to="/login" class="text-brand-400 hover:underline">{{ $t('auth.switch_to_login') }}</NuxtLink>
    </p>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { LucideMail } from '#components'

definePageMeta({ layout: 'auth', ssr: false })

const toast = useToast()
const { t } = useI18n()

const email = ref('')
const submitting = ref(false)
const sent = ref(false)
const errors = reactive({ email: '' })

async function onSubmit() {
  errors.email = ''
  if (!/^.+@.+\..+$/.test(email.value)) {
    errors.email = t('errors.EMAIL_INVALID_FORMAT')
    return
  }
  submitting.value = true
  try {
    await useApi('/api/auth/password/forgot', {
      method: 'POST',
      body: { email: email.value.trim() },
      anonymous: true,
    })
    // Always shown on success, whether or not the email is actually
    // registered — the backend deliberately never reveals that, so the UI
    // can't either.
    sent.value = true
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    submitting.value = false
  }
}
</script>
