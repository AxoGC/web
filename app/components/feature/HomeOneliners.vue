<template>
  <section v-if="items.length || isLoggedIn" class="relative">
    <div
      class="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated p-4 md:p-10 min-h-[10rem]"
    >
      <!-- Decorative outsized quote glyph. Behind everything, very faded;
           positioned slightly off the top-left so the curl reads naturally. -->
      <LucideQuote
        :size="160"
        class="absolute -top-4 -left-4 text-text-tertiary/10 pointer-events-none select-none"
        aria-hidden="true"
      />

      <!-- Submit button: only for logged-in users. Anonymous viewers just
           see the quote; the call-to-action would 401 anyway. -->
      <button
        v-if="isLoggedIn"
        type="button"
        class="absolute top-3 right-3 z-10 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-bg-overlay/70 hover:bg-bg-hover text-text-secondary transition-colors"
        @click="openSubmit"
      >
        <LucidePenLine :size="12" />
        {{ $t('oneliner.submit_cta') }}
      </button>

      <div v-if="!items.length" class="relative text-sm text-text-tertiary italic">
        {{ $t('oneliner.empty_hint') }}
      </div>
      <div v-else class="relative">
        <Transition name="oneliner-fade" mode="out-in">
          <div :key="current.id" class="space-y-3">
            <p class="italic text-lg md:text-xl leading-relaxed text-text-primary break-words">
              {{ current.text }}
            </p>
            <p class="text-sm text-text-secondary text-right">
              — {{ current.author.username || $t('oneliner.anon') }}
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Submit modal -->
    <UiModal
      v-if="isLoggedIn"
      :open="submitOpen"
      :title="$t('oneliner.submit_title')"
      size="md"
      @update:open="submitOpen = $event"
    >
      <div class="space-y-3">
        <p v-if="myItem" class="text-sm text-text-secondary">
          <template v-if="myItem.active">{{ $t('oneliner.status_active') }}</template>
          <template v-else>{{ $t('oneliner.status_pending') }}</template>
        </p>
        <p v-else class="text-sm text-text-tertiary">
          {{ $t('oneliner.submit_hint') }}
        </p>
        <UiTextarea
          v-if="!myItem"
          v-model="draft"
          :rows="3"
          :placeholder="$t('oneliner.placeholder')"
          :invalid="!!submitErr"
          :maxlength="60"
        />
        <p v-if="myItem" class="rounded-md bg-bg-overlay/50 p-3 italic text-text-primary">
          {{ myItem.text }}
        </p>
        <p v-if="submitErr" class="text-xs text-danger">{{ submitErr }}</p>
        <p v-if="!myItem" class="text-xs text-text-tertiary text-right">{{ draft.length }} / 60</p>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="submitOpen = false">{{ $t('actions.close') }}</UiButton>
        <UiButton
          v-if="!myItem"
          :loading="submitting"
          :disabled="!draft.trim()"
          @click="doSubmit"
        >
          {{ $t('actions.submit') }}
        </UiButton>
      </template>
    </UiModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

interface Author { id: number, username: string, avatar: string }
interface PublicItem { id: number, text: string, author: Author }
interface MineItem { id: number, text: string, active: boolean, created_at: number }

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const isLoggedIn = computed(() => !!auth.user)

const items = ref<PublicItem[]>([])
const idx = ref(0)
const current = computed<PublicItem>(() =>
  items.value[idx.value] ?? { id: 0, text: '', author: { id: 0, username: '', avatar: '' } },
)

const submitOpen = ref(false)
const myItem = ref<MineItem | null>(null)
const draft = ref('')
const submitErr = ref('')
const submitting = ref(false)

let rotateTimer: ReturnType<typeof setInterval> | null = null

async function loadPublic() {
  try {
    const r = await useApi<{ items: PublicItem[] }>('/api/oneliners/active')
    // Shuffle so refresh doesn't always show the same first row.
    items.value = shuffle(r.items || [])
    idx.value = 0
  } catch {
    items.value = []
  }
}

async function loadMine() {
  if (!isLoggedIn.value) {
    myItem.value = null
    return
  }
  try {
    const r = await useApi<{ item: MineItem | null }>('/api/oneliners/me')
    myItem.value = r.item
  } catch {
    myItem.value = null
  }
}

function openSubmit() {
  draft.value = ''
  submitErr.value = ''
  submitOpen.value = true
  loadMine()
}

async function doSubmit() {
  const t0 = draft.value.trim()
  if (!t0) return
  submitting.value = true
  submitErr.value = ''
  try {
    await useApi('/api/oneliners', { method: 'POST', body: { text: t0 } })
    toast.success(t('oneliner.submit_success'))
    await loadMine()
    draft.value = ''
  } catch (e) {
    if (e instanceof ApiError) {
      submitErr.value = t(`errors.${e.code}`, e.code)
    }
  } finally {
    submitting.value = false
  }
}

// Fisher-Yates so the carousel order is unpredictable per visit.
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function startRotation() {
  stopRotation()
  if (items.value.length <= 1) return
  rotateTimer = setInterval(() => {
    idx.value = (idx.value + 1) % items.value.length
  }, 6000)
}
function stopRotation() {
  if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null }
}

watch(items, startRotation)
watch(() => auth.user?.id, () => { loadMine() })

onMounted(() => { loadPublic() })
onBeforeUnmount(stopRotation)
</script>

<style scoped>
.oneliner-fade-enter-active,
.oneliner-fade-leave-active {
  transition: opacity 400ms ease, transform 400ms ease;
}
.oneliner-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.oneliner-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
