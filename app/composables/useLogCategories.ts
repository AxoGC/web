import type { LogCategory, ServerType } from '~/types/api'
import { primaryServerType } from '~/composables/useServerTypes'

/**
 * Frontend's hardcoded copy of core's `behaviorlog.gameTypeCategories` map
 * (internal/modules/behaviorlog/service.go). Backend is the source of truth
 * that actually gets enforced — this one only decides what the "submit
 * query" form offers, per game type, so no i18n plumbing is needed here.
 */
const GAME_TYPE_CATEGORIES: Record<string, LogCategory[]> = {
  'mc-java': ['block', 'kill', 'player_presence', 'container', 'chat'],
  'mc-bedrock': ['block', 'kill', 'player_presence', 'container', 'chat'],
  'mc-be': ['block', 'kill', 'player_presence', 'container', 'chat'],
  'dst': ['player_presence', 'chat'],
  'terraria': ['player_presence', 'chat'],
}

/** Mirrors behaviorlog.allowedFilterKeys — which extra filter fields a category's form should render. */
const CATEGORY_FILTER_KEYS: Record<LogCategory, string[]> = {
  block: ['action', 'block_id', 'world', 'pos_range'],
  kill: ['entity_type', 'world', 'pos_range'],
  player_presence: ['action'],
  container: ['block_id', 'item_id', 'world', 'pos_range'],
  chat: [],
}

export function logCategoriesForGameType(type: ServerType | string | undefined | null): LogCategory[] {
  if (!type) return []
  return GAME_TYPE_CATEGORIES[primaryServerType(type)] ?? []
}

export function filterKeysForCategory(category: LogCategory | ''): string[] {
  if (!category) return []
  return CATEGORY_FILTER_KEYS[category] ?? []
}

/** Values the "action" filter can take, per category — shared between the submit and admin-review forms. */
const ACTION_VALUES: Partial<Record<LogCategory, string[]>> = {
  block: ['break', 'place'],
  player_presence: ['join', 'leave'],
}

const ACTION_I18N_KEY: Record<string, string> = {
  break: 'block_action_break',
  place: 'block_action_place',
  join: 'presence_action_join',
  leave: 'presence_action_leave',
}

export function actionValuesForCategory(category: LogCategory | ''): string[] {
  if (!category) return []
  return ACTION_VALUES[category] ?? []
}

export function actionI18nKey(value: string): string {
  return `log_query.${ACTION_I18N_KEY[value] ?? value}`
}

const STATUS_VARIANT = { pending: 'warning', approved: 'success', rejected: 'danger' } as const

export function logQueryStatusVariant(status: 'pending' | 'approved' | 'rejected') {
  return STATUS_VARIANT[status]
}

/**
 * Known dimension folder names for the vanilla-layout Java world (confirmed
 * against production data: `select distinct world from behavior_block_logs`
 * only ever returns these three). Not backend-enforced — the filter's value
 * is still stored/matched as plain text, this is purely a display/UX
 * constraint to stop users from mistyping a world name that can never match.
 */
const WORLD_I18N_KEY: Record<string, string> = {
  world: 'world_overworld',
  world_nether: 'world_nether',
  world_the_end: 'world_the_end',
}

export function worldOptionValues(): string[] {
  return Object.keys(WORLD_I18N_KEY)
}

export function worldI18nKey(value: string): string {
  return `log_query.${WORLD_I18N_KEY[value] ?? value}`
}
