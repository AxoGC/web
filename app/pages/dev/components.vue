<template>
  <div class="space-y-10">
    <header>
      <h1 class="text-2xl font-bold">/dev/components</h1>
      <p class="text-text-secondary">Living gallery of the UI primitive set.</p>
    </header>

    <section>
      <h2 class="section-heading">Buttons</h2>
      <div class="flex flex-wrap gap-3 items-center">
        <UiButton>Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="ghost">Ghost</UiButton>
        <UiButton variant="outline">Outline</UiButton>
        <UiButton variant="danger">Danger</UiButton>
        <UiButton loading>Loading</UiButton>
        <UiButton disabled>Disabled</UiButton>
      </div>
      <div class="flex flex-wrap gap-3 mt-3">
        <UiButton size="sm">Small</UiButton>
        <UiButton size="md">Medium</UiButton>
        <UiButton size="lg">Large</UiButton>
      </div>
    </section>

    <section>
      <h2 class="section-heading">Inputs</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <UiField label="Default">
          <UiInput v-model="vText" placeholder="Type here…" />
        </UiField>
        <UiField label="With icon">
          <UiInput v-model="vText" :leading-icon="LucideSearch" placeholder="Search" />
        </UiField>
        <UiField label="Error" error="Looks wrong">
          <UiInput v-model="vText" invalid />
        </UiField>
        <UiField label="Textarea">
          <UiTextarea v-model="vLong" :rows="3" />
        </UiField>
        <UiField label="Select">
          <UiSelect v-model="vSelect" :options="selectOpts" />
        </UiField>
        <UiField label="Select (with placeholder)">
          <UiSelect v-model="vSelectPlaceholder" :options="selectOpts" placeholder="Pick one" />
        </UiField>
        <UiField label="Date &amp; time">
          <UiDateTimePicker v-model="vDateTime" />
        </UiField>
      </div>

      <h3 class="text-sm font-medium text-text-secondary mt-6 mb-2">Horizontal layout (per-field opt-in)</h3>
      <div class="max-w-md">
        <UiField label="Select" horizontal>
          <UiSelect v-model="vSelect" :options="selectOpts" />
        </UiField>
        <UiField label="Date &amp; time" horizontal>
          <UiDateTimePicker v-model="vDateTime" />
        </UiField>
        <UiField label="Text (stays vertical)">
          <UiInput v-model="vText" placeholder="Inputs/textareas ignore horizontal" />
        </UiField>
      </div>
    </section>

    <section>
      <h2 class="section-heading">Tags & Badges</h2>
      <div class="flex flex-wrap items-center gap-2">
        <UiTag>Default</UiTag>
        <UiTag variant="brand">Brand</UiTag>
        <UiTag variant="success">Success</UiTag>
        <UiTag variant="warning">Warning</UiTag>
        <UiTag variant="danger">Danger</UiTag>
        <UiTag variant="info">Info</UiTag>
        <UiTag color="#a855f7">Custom</UiTag>
      </div>
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <UiBadge>1</UiBadge>
        <UiBadge variant="brand">9</UiBadge>
        <UiBadge variant="success">A</UiBadge>
        <UiBadge variant="danger">!</UiBadge>
      </div>
    </section>

    <section>
      <h2 class="section-heading">Status</h2>
      <div class="flex flex-wrap items-center gap-4">
        <UiStatusDot status="online">online</UiStatusDot>
        <UiStatusDot status="offline">offline</UiStatusDot>
        <UiStatusDot status="maintenance">maintenance</UiStatusDot>
      </div>
    </section>

    <section>
      <h2 class="section-heading">Avatars</h2>
      <div class="flex items-center gap-3">
        <UiAvatar size="xs" name="Steve" />
        <UiAvatar size="sm" name="Alex" />
        <UiAvatar size="md" name="Steve" />
        <UiAvatar size="lg" name="Steve" />
        <UiAvatar size="xl" name="王小明" />
      </div>
    </section>

    <section>
      <h2 class="section-heading">Toasts</h2>
      <div class="flex gap-2">
        <UiButton size="sm" variant="secondary" @click="toast.success('All good!')">Success</UiButton>
        <UiButton size="sm" variant="secondary" @click="toast.error('Something broke.')">Error</UiButton>
        <UiButton size="sm" variant="secondary" @click="toast.info('Hi.')">Info</UiButton>
        <UiButton size="sm" variant="secondary" @click="toast.warning('Heads up.')">Warning</UiButton>
      </div>
    </section>

    <section>
      <h2 class="section-heading">Modal</h2>
      <UiButton size="sm" @click="modalOpen = true">Open modal</UiButton>
      <UiButton size="sm" variant="danger" @click="confirmOpen = true">Open confirm</UiButton>
      <UiModal v-model:open="modalOpen" title="Hello">
        <p>This is a modal body.</p>
        <template #footer>
          <UiButton variant="ghost" @click="modalOpen = false">Cancel</UiButton>
          <UiButton @click="modalOpen = false">OK</UiButton>
        </template>
      </UiModal>
      <UiConfirmModal
        v-model:open="confirmOpen"
        title="Delete item?"
        message="This cannot be undone."
        variant="danger"
        @confirm="confirmOpen = false"
      />
    </section>

    <section>
      <h2 class="section-heading">Tabs</h2>
      <UiTabs
        v-model="tab"
        :tabs="[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }]"
      >
        <UiTabPanel value="a">Alpha contents.</UiTabPanel>
        <UiTabPanel value="b">Beta contents.</UiTabPanel>
        <UiTabPanel value="c">Gamma contents.</UiTabPanel>
      </UiTabs>
    </section>

    <section>
      <h2 class="section-heading">Skeleton</h2>
      <div class="space-y-2 max-w-md">
        <UiSkeleton variant="line" />
        <UiSkeleton variant="line" width="60%" />
        <UiSkeleton variant="card" :height="80" />
      </div>
    </section>

    <section>
      <h2 class="section-heading">Empty</h2>
      <UiEmpty message="Nothing here yet" />
    </section>

    <section>
      <h2 class="section-heading">Pagination</h2>
      <UiPagination :page="page" :page-size="10" :total="103" @update:page="(p) => page = p" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '~/composables/useToast'
import { LucideSearch } from '#components'

definePageMeta({ layout: 'auth', ssr: false })
useHead({ title: 'Components' })

const toast = useToast()
const vText = ref('')
const vLong = ref('')
const vSelect = ref('a')
const vSelectPlaceholder = ref('')
const selectOpts = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]
const vDateTime = ref<number | undefined>(undefined)
const modalOpen = ref(false)
const confirmOpen = ref(false)
const tab = ref('a')
const page = ref(3)
</script>

<style scoped>
.section-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}
</style>
