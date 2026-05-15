<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">{{ $t('forum.new_post') }}</h1>

    <UiCard padded>
      <UiField :label="$t('forum.tags')" help="">
        <UiSelect
          v-model="forumId"
          :options="forumOptions"
          :placeholder="$t('nav.forums')"
        />
      </UiField>

      <UiField :label="$t('forum.title_placeholder')" required :error="titleErr">
        <UiInput v-model="title" :placeholder="$t('forum.title_placeholder')" :invalid="!!titleErr" />
      </UiField>

      <UiField :label="$t('forum.content_placeholder')" required :error="contentErr">
        <UiTextarea v-model="content" :rows="14" :placeholder="$t('forum.content_placeholder')" :invalid="!!contentErr" />
      </UiField>

      <div class="flex items-center justify-end gap-2 mt-6">
        <NuxtLink :to="back">
          <UiButton variant="ghost">{{ $t('actions.cancel') }}</UiButton>
        </NuxtLink>
        <UiButton :loading="submitting" @click="submit">{{ $t('forum.publish') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Forum } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const forumId = ref<number | string>(Number(route.query.forum_id) || '')
const title = ref('')
const content = ref('')
const submitting = ref(false)
const titleErr = ref('')
const contentErr = ref('')

const forums = ref<Forum[]>([])
onMounted(async () => {
  try {
    const r = await useApi<{ items: Forum[] }>('/api/forums')
    forums.value = r.items
  } catch (e) {
    toast.fromError(e)
  }
})

const forumOptions = computed(() =>
  forums.value.map((f) => ({ value: f.id, label: f.name })),
)

const back = computed(() => {
  const fid = Number(forumId.value)
  const f = forums.value.find((x) => x.id === fid)
  return f ? `/forums/${f.slug}` : '/forums'
})

async function submit() {
  titleErr.value = ''
  contentErr.value = ''
  const trimmedTitle = title.value.trim()
  if (trimmedTitle.length < 2 || trimmedTitle.length > 200) {
    titleErr.value = t('errors.TITLE_INVALID')
    return
  }
  if (!content.value.trim()) {
    contentErr.value = t('errors.CONTENT_INVALID')
    return
  }
  if (!forumId.value) {
    toast.error(t('errors.FORUM_NOT_FOUND'))
    return
  }
  submitting.value = true
  try {
    const r = await useApi<{ id: number }>('/api/posts', {
      method: 'POST',
      body: {
        forum_id: Number(forumId.value),
        title: trimmedTitle,
        content: content.value,
      },
    })
    toast.success(t('forum.post_created'))
    router.push(`/posts/${r.id}`)
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'TITLE_INVALID') titleErr.value = t('errors.TITLE_INVALID')
      else if (e.code === 'CONTENT_INVALID') contentErr.value = t('errors.CONTENT_INVALID')
      else toast.fromError(e)
    } else toast.fromError(e)
  } finally {
    submitting.value = false
  }
}
</script>
