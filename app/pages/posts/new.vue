<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12 max-w-3xl mx-auto">
    <h1 class="text-2xl mb-6">{{ $t('forum.new_post') }}</h1>

    <UiCard padded>
      <UiField :label="$t('nav.forums')" required>
        <UiSelect
          v-model="forumId"
          :options="forumOptions"
          :placeholder="$t('nav.forums')"
        />
      </UiField>

      <UiField
        :label="$t('forum.tags')"
        :help="tagHelpText"
      >
        <div v-if="tagsPending" class="text-xs text-text-tertiary">{{ $t('common.loading') }}</div>
        <div v-else-if="!forumId" class="text-xs text-text-tertiary">{{ $t('forum.tags_pick_forum_first') }}</div>
        <div v-else-if="!availableTags.length" class="text-xs text-text-tertiary">{{ $t('forum.tags_empty') }}</div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="tag in availableTags"
            :key="tag.id"
            type="button"
            class="cursor-pointer transition focus:outline-none rounded-md"
            :class="[
              selectedTagIds.includes(tag.id) ? 'ring-2 ring-offset-1 ring-offset-bg-base' : 'opacity-65 hover:opacity-100',
              !selectedTagIds.includes(tag.id) && selectedTagIds.length >= 3 ? 'opacity-30 cursor-not-allowed hover:opacity-30' : '',
            ]"
            :style="selectedTagIds.includes(tag.id) ? { '--tw-ring-color': tag.color } : undefined"
            :disabled="!selectedTagIds.includes(tag.id) && selectedTagIds.length >= 3"
            @click="toggleTag(tag.id)"
          >
            <UiTag :color="tag.color" size="md">{{ tag.name }}</UiTag>
          </button>
        </div>
      </UiField>

      <UiField :label="$t('forum.title_placeholder')" required :error="titleErr">
        <UiInput v-model="title" :placeholder="$t('forum.title_placeholder')" :invalid="!!titleErr" />
      </UiField>

      <UiField :label="$t('forum.content_placeholder')" required :error="contentErr">
        <RichEditor
          v-model="contentDoc"
          v-model:attachment-ids="attachmentIds"
          @update:text="contentText = $event"
        />
      </UiField>

      <UiField :label="$t('forum.voting_label')" :help="$t('forum.voting_help')">
        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input v-model="votingEnabled" type="checkbox" class="h-4 w-4 rounded border-border-default bg-bg-elevated">
          <span class="text-sm">{{ $t('forum.voting_enable') }}</span>
        </label>
      </UiField>

      <UiField
        v-if="votingEnabled"
        :label="$t('forum.poll_options_label')"
        :help="$t('forum.poll_options_help')"
        :error="pollErr"
        required
      >
        <div class="space-y-2">
          <div v-for="(_, i) in pollOptions" :key="i" class="flex items-center gap-2">
            <UiInput
              v-model="pollOptions[i]"
              :placeholder="$t('forum.poll_option_placeholder', { index: i + 1 })"
              :maxlength="64"
            />
            <UiButton
              v-if="pollOptions.length > 2"
              variant="ghost"
              size="sm"
              class="shrink-0 text-danger"
              @click="removeOption(i)"
            >
              {{ $t('forum.poll_option_remove') }}
            </UiButton>
          </div>
          <UiButton
            v-if="pollOptions.length < 10"
            variant="outline"
            size="sm"
            @click="addOption"
          >
            {{ $t('forum.poll_option_add') }}
          </UiButton>
        </div>
      </UiField>

      <div class="flex flex-wrap items-center justify-end gap-2 mt-6">
        <NuxtLink :to="back">
          <UiButton variant="ghost">{{ $t('actions.cancel') }}</UiButton>
        </NuxtLink>
        <UiButton :loading="submitting" @click="submit">{{ $t('forum.publish') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Forum, TiptapDoc } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { emptyDoc } from '~/utils/tiptap'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })

interface TagOption {
  id: number
  forum_id: number
  name: string
  color: string
  sort: number
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const forumId = ref<number | string>(Number(route.query.forum_id) || '')
const title = ref('')
const contentDoc = ref<TiptapDoc>(emptyDoc())
const contentText = ref('')
// Ids returned by /api/attachments during draft uploads. Submitted as
// attachment_ids[] so core can stamp post_id on these rows. Orphans (post
// never submitted) get GC'd by the hourly job.
const attachmentIds = ref<number[]>([])
const votingEnabled = ref(false)
const pollOptions = ref<string[]>(['', ''])
const pollErr = ref('')
const submitting = ref(false)
const titleErr = ref('')
const contentErr = ref('')

function addOption() {
  if (pollOptions.value.length < 10) pollOptions.value.push('')
}
function removeOption(i: number) {
  if (pollOptions.value.length > 2) pollOptions.value.splice(i, 1)
}

const forums = ref<Forum[]>([])
const availableTags = ref<TagOption[]>([])
const selectedTagIds = ref<number[]>([])
const tagsPending = ref(false)

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

const selectedForum = computed(() => {
  const fid = Number(forumId.value)
  return forums.value.find((x) => x.id === fid)
})

const tagHelpText = computed(() => {
  if (!forumId.value || !availableTags.value.length) return ''
  return t('forum.tags_help', { count: selectedTagIds.value.length })
})

watch(selectedForum, async (f) => {
  selectedTagIds.value = []
  availableTags.value = []
  if (!f) return
  tagsPending.value = true
  try {
    const r = await useApi<{ items: TagOption[] }>(`/api/forums/${f.slug}/tags`)
    availableTags.value = r.items
  } catch (e) {
    toast.fromError(e)
  } finally {
    tagsPending.value = false
  }
}, { immediate: true })

function toggleTag(id: number) {
  const idx = selectedTagIds.value.indexOf(id)
  if (idx >= 0) {
    selectedTagIds.value.splice(idx, 1)
  } else if (selectedTagIds.value.length < 3) {
    selectedTagIds.value.push(id)
  }
}

const back = computed(() => {
  const f = selectedForum.value
  return f ? `/forums/${f.slug}` : '/forums'
})

async function submit() {
  titleErr.value = ''
  contentErr.value = ''
  pollErr.value = ''
  const trimmedTitle = title.value.trim()
  if (trimmedTitle.length < 2 || trimmedTitle.length > 200) {
    titleErr.value = t('errors.TITLE_INVALID')
    return
  }
  if (!contentText.value.trim()) {
    contentErr.value = t('errors.CONTENT_INVALID')
    return
  }
  if (!forumId.value) {
    toast.error(t('errors.FORUM_NOT_FOUND'))
    return
  }
  let pollPayload: string[] = []
  if (votingEnabled.value) {
    const trimmed = pollOptions.value.map((s) => s.trim()).filter((s) => s.length > 0)
    const dedup = new Set(trimmed)
    if (trimmed.length < 2 || trimmed.length > 10 || dedup.size !== trimmed.length
        || trimmed.some((s) => [...s].length > 64)) {
      pollErr.value = t('errors.POLL_OPTIONS_INVALID')
      return
    }
    pollPayload = trimmed
  }
  submitting.value = true
  try {
    const r = await useApi<{ id: number }>('/api/posts', {
      method: 'POST',
      body: {
        forum_id: Number(forumId.value),
        title: trimmedTitle,
        content_json: contentDoc.value,
        content_text: contentText.value,
        voting_enabled: votingEnabled.value,
        poll_options: pollPayload,
        tag_ids: selectedTagIds.value,
        attachment_ids: attachmentIds.value,
      },
    })
    toast.success(t('forum.post_created'))
    router.push(`/posts/${r.id}`)
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'TITLE_INVALID') titleErr.value = t('errors.TITLE_INVALID')
      else if (e.code === 'CONTENT_INVALID') contentErr.value = t('errors.CONTENT_INVALID')
      else if (e.code === 'POLL_OPTIONS_INVALID') pollErr.value = t('errors.POLL_OPTIONS_INVALID')
      else if (e.code === 'TAG_LIMIT_EXCEEDED') toast.error(t('errors.TAG_LIMIT_EXCEEDED'))
      else if (e.code === 'TAG_INVALID') toast.error(t('errors.TAG_INVALID'))
      else toast.fromError(e)
    } else toast.fromError(e)
  } finally {
    submitting.value = false
  }
}
</script>
