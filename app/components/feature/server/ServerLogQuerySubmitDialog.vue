<template>
  <UiModal :open="open" :title="$t('log_query.dialog_title')" size="xl" @update:open="onUpdateOpen">
    <div class="space-y-3">
      <UiField :label="$t('log_query.field_category')" required horizontal label-width="w-[84px]">
        <UiSelect v-model="category" :options="categoryOptions" />
      </UiField>

      <UiField :label="$t('log_query.field_reason')" required :help="$t('log_query.reason_disclaimer')">
        <UiTextarea
          v-model="reason"
          :rows="3"
          :placeholder="$t('log_query.field_reason_placeholder')"
        />
      </UiField>

      <p class="text-xs font-medium text-text-tertiary uppercase tracking-wide pt-1">
        {{ $t('log_query.filters_title') }}
      </p>
      <UiField :label="$t('log_query.field_target_player')" horizontal label-width="w-[84px]">
        <ServerLogFieldSearchInput
          v-model="targetPlayer"
          :server-id="serverId"
          :category="category"
          field="player"
          :placeholder="$t('log_query.field_target_player_placeholder')"
        />
      </UiField>
      <UiField :label="$t('log_query.field_from')" horizontal label-width="w-[84px]">
        <UiDateTimePicker v-model="fromTs" />
      </UiField>
      <UiField :label="$t('log_query.field_to')" horizontal label-width="w-[84px]">
        <UiDateTimePicker v-model="toTs" />
      </UiField>
      <UiField v-if="filterKeys.includes('action')" :label="$t('log_query.filter_action')" horizontal label-width="w-[84px]">
        <UiSelect v-model="filters.action" :options="actionOptions" :placeholder="$t('log_query.filter_unset')" />
      </UiField>
      <UiField v-if="filterKeys.includes('block_id')" :label="$t('log_query.filter_block_id')" horizontal label-width="w-[84px]">
        <ServerLogFieldSearchInput
          v-model="filters.block_id"
          :server-id="serverId"
          :category="category"
          field="block_id"
          placeholder="minecraft:chest"
        />
      </UiField>
      <UiField v-if="filterKeys.includes('item_id')" :label="$t('log_query.filter_item_id')" horizontal label-width="w-[84px]">
        <ServerLogFieldSearchInput
          v-model="filters.item_id"
          :server-id="serverId"
          :category="category"
          field="item_id"
          placeholder="minecraft:diamond"
        />
      </UiField>
      <UiField v-if="filterKeys.includes('entity_type')" :label="$t('log_query.filter_entity_type')">
        <UiInput v-model="filters.entity_type" placeholder="minecraft:zombie" />
      </UiField>
      <UiField v-if="filterKeys.includes('world')" :label="$t('log_query.filter_world')" horizontal label-width="w-[84px]">
        <UiSelect v-model="filters.world" :options="worldOptions" :placeholder="$t('log_query.filter_unset')" />
      </UiField>
      <UiField v-if="filterKeys.includes('pos_range')" :label="$t('log_query.filter_pos_range')" horizontal label-width="w-[84px]">
        <ServerLogPosRangeField v-model="filters.pos_range" />
      </UiField>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.cancel') }}</UiButton>
      <UiButton :loading="submitting" :disabled="!canSubmit" @click="submit">
        {{ $t('log_query.submit_button') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { LogCategory, LogQueryRequestItem } from '~/types/api'
import {
  logCategoriesForGameType, filterKeysForCategory, actionValuesForCategory, actionI18nKey,
  worldOptionValues, worldI18nKey,
} from '~/composables/useLogCategories'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  open: boolean
  serverId: string | number
  serverType: string
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'submitted': [item: LogQueryRequestItem]
}>()

const { t } = useI18n()
const toast = useToast()

const targetPlayer = ref('')
const category = ref<LogCategory | ''>('')
const reason = ref('')
const fromTs = ref<number | undefined>(undefined)
const toTs = ref<number | undefined>(undefined)
const filters = reactive<Record<string, string>>({ action: '', block_id: '', item_id: '', entity_type: '', world: '', pos_range: '' })
const submitting = ref(false)

const availableCategories = computed(() => logCategoriesForGameType(props.serverType))
const categoryOptions = computed(() =>
  availableCategories.value.map(c => ({ value: c, label: t(`log_query.category_${c}`) })),
)
const filterKeys = computed(() => filterKeysForCategory(category.value))

const actionOptions = computed(() =>
  actionValuesForCategory(category.value).map(v => ({ value: v, label: t(actionI18nKey(v)) })),
)
const worldOptions = computed(() =>
  worldOptionValues().map(v => ({ value: v, label: t(worldI18nKey(v)) })),
)

// Reset the category to the first available option whenever the dialog opens
// or the server's allowed set changes, so an old selection never lingers
// across game types.
watch([() => props.open, availableCategories], ([isOpen, cats]) => {
  if (isOpen && !cats.includes(category.value as LogCategory)) {
    category.value = cats[0] ?? ''
  }
})

// Filter fields not relevant to the current category shouldn't be silently
// carried into the submit payload.
watch(category, () => {
  for (const k of Object.keys(filters)) {
    if (!filterKeys.value.includes(k)) filters[k] = ''
  }
})

const canSubmit = computed(() =>
  !!category.value && !!reason.value.trim() && !submitting.value,
)

function reset() {
  targetPlayer.value = ''
  reason.value = ''
  fromTs.value = undefined
  toTs.value = undefined
  filters.action = ''
  filters.block_id = ''
  filters.item_id = ''
  filters.entity_type = ''
  filters.world = ''
  filters.pos_range = ''
}

function onUpdateOpen(value: boolean) {
  emit('update:open', value)
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const activeFilters: Record<string, string> = {}
    for (const k of filterKeys.value) {
      if (filters[k]) activeFilters[k] = filters[k]
    }
    const item = await useApi<LogQueryRequestItem>('/api/query-requests', {
      method: 'POST',
      body: {
        target_server_id: Number(props.serverId),
        target_player: targetPlayer.value.trim(),
        category: category.value,
        reason: reason.value.trim(),
        from_ts: fromTs.value,
        to_ts: toTs.value,
        filters: activeFilters,
      },
    })
    toast.success(t('log_query.submit_success'))
    reset()
    emit('update:open', false)
    emit('submitted', item)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    submitting.value = false
  }
}
</script>
