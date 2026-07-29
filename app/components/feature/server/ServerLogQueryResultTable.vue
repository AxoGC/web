<template>
  <UiEmpty v-if="!rows.length" :message="$t('log_query.result_empty')" />
  <template v-else>
    <div class="overflow-x-auto -mx-1">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-text-tertiary">
            <th v-for="col in columns" :key="col" class="text-left px-1 py-1 font-medium whitespace-nowrap">
              {{ colLabel(col) }}
            </th>
            <th v-if="showItemsColumn" class="text-left px-1 py-1 font-medium whitespace-nowrap">
              {{ $t('log_query.result_col_items') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in pagedRows"
            :key="i"
            :class="[
              'border-t border-border-subtle',
              showItemsColumn ? 'cursor-pointer hover:bg-bg-hover' : '',
            ]"
            @click="showItemsColumn && openItems(row)"
          >
            <td v-for="col in columns" :key="col" class="px-1 py-1 align-top">
              {{ formatCell(col, row[col]) }}
            </td>
            <td v-if="showItemsColumn" class="px-1 py-1 align-top text-brand-400">
              {{ itemsHint(row.items) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-3 flex justify-center">
      <UiPagination :page="page" :page-size="pageSize" :total="rows.length" @update:page="page = $event" />
    </div>

    <ServerLogQueryContainerItemsDialog
      v-model:open="itemsDialogOpen"
      :items="(activeItems as ContainerLogItem[])"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuditTime } from '~/composables/useAuditTime'
import type { ContainerLogItem } from './ServerLogQueryContainerItemsDialog.vue'

// Generic renderer for a behavior-log evidence snapshot — column set is
// derived from the first row's own keys rather than hardcoded per category,
// since the 5 categories all have a different, backend-owned shape. `id` /
// `server_id` are always dropped: id is a DB primary key with no review
// value, and server_id is constant across the whole result (the query is
// already scoped to one server via its own entry point).
const props = defineProps<{ rows: Record<string, unknown>[], category?: string }>()

const { t } = useI18n()
const { formatAuditTimestamp } = useAuditTime()

const hiddenCols = new Set(['id', 'server_id', 'items'])
const columns = computed(() => Object.keys(props.rows[0] ?? {}).filter(c => !hiddenCols.has(c)))

// Container rows carry a nested item-movement array — rendering it as raw
// JSON in a cell is unreadable, so it gets its own summary column + a
// click-through to a dialog instead of a generic `formatCell` column.
const showItemsColumn = computed(() => props.category === 'container')

const colLabels: Record<string, string> = {
  timestamp: 'log_query.result_col_timestamp',
  player: 'log_query.result_col_player',
  pos_x: 'log_query.result_col_pos_x',
  pos_y: 'log_query.result_col_pos_y',
  pos_z: 'log_query.result_col_pos_z',
  message: 'log_query.result_col_message',
  action: 'log_query.filter_action',
  block_id: 'log_query.filter_block_id',
  world: 'log_query.filter_world',
  entity_type: 'log_query.filter_entity_type',
}
function colLabel(col: string): string {
  const key = colLabels[col]
  return key ? t(key) : col
}

// A single approved snapshot can hold up to 5000 rows (backend snapshotLimit)
// — rendering all of them into one DOM table at once would be sluggish, so
// they're paginated client-side. The rows are already a fully-loaded local
// array (a stored JSON snapshot, not a live query), so slicing in-memory is
// enough; no API round-trip needed. Page size is fixed rather than
// user-configurable — this is evidence review, not a general data browser.
const pageSize = 50
const page = ref(1)

// A different query's rows can be shorter than the current page — reset
// rather than leaving pagedRows empty with dead page-number buttons.
watch(() => props.rows, () => { page.value = 1 })

const pagedRows = computed(() => props.rows.slice((page.value - 1) * pageSize, page.value * pageSize))

function formatCell(col: string, v: unknown): string {
  if (v === null || v === undefined) return ''
  if (col === 'timestamp' && (typeof v === 'string' || typeof v === 'number')) {
    return formatAuditTimestamp(new Date(v))
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function itemsHint(items: unknown): string {
  const n = Array.isArray(items) ? items.length : 0
  return n ? t('log_query.result_items_hint', { n }) : t('log_query.result_items_empty')
}

const itemsDialogOpen = ref(false)
const activeItems = ref<ContainerLogItem[]>([])

function openItems(row: Record<string, unknown>) {
  activeItems.value = (Array.isArray(row.items) ? row.items : []) as ContainerLogItem[]
  itemsDialogOpen.value = true
}
</script>
