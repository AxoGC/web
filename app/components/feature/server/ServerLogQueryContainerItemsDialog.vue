<template>
  <UiModal :open="open" :title="$t('log_query.items_dialog_title')" size="sm" @update:open="emit('update:open', $event)">
    <UiEmpty v-if="!items.length" :message="$t('log_query.result_items_empty')" />
    <table v-else class="w-full text-sm">
      <thead>
        <tr class="text-text-tertiary">
          <th class="text-left px-1 py-1 font-medium">{{ $t('log_query.col_item_id') }}</th>
          <th class="text-left px-1 py-1 font-medium">{{ $t('log_query.col_quantity') }}</th>
          <th class="text-left px-1 py-1 font-medium">{{ $t('log_query.col_direction') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in items" :key="i" class="border-t border-border-subtle">
          <td class="px-1 py-1.5 align-top">{{ item.item_id }}</td>
          <td class="px-1 py-1.5 align-top">{{ item.quantity }}</td>
          <td class="px-1 py-1.5 align-top">
            <UiTag :variant="item.direction === 'put' ? 'success' : 'danger'" size="sm">
              {{ $t(item.direction === 'put' ? 'log_query.direction_put' : 'log_query.direction_take') }}
            </UiTag>
          </td>
        </tr>
      </tbody>
    </table>

    <template #footer>
      <UiButton variant="ghost" @click="emit('update:open', false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
export interface ContainerLogItem {
  item_id: string
  quantity: number
  direction: 'take' | 'put'
}

defineProps<{ open: boolean, items: ContainerLogItem[] }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>
