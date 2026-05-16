/** Shared API DTO shapes. Mirror backend response envelopes; keep names exact. */

export interface UserSummary {
  id: number
  username: string
  avatar?: string
  role?: string
}

export interface PublicUser {
  id: number
  username: string
  avatar: string
  bio: string
  role: string
  created_at: number
  /** Unix seconds; omitted when the user has never logged in. */
  last_login_at?: number
}

export interface UserBinding {
  server_id: number
  server_name: string
  server_type: string
  game_name: string
  play_time_seconds: number
  bound_at: number
}

export interface UserProfileStats {
  checkin_streak: number
  checkin_total: number
  forum_post_count: number
  forum_comment_count: number
  forum_likes_received: number
}

export interface MeDTO extends PublicUser {
  email: string
  email_verified: boolean
  status: string
}

export interface Forum {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  banner_url?: string
  sort: number
  post_count: number
  today_new_count?: number
  active_users_7d?: number
}

export interface Tag {
  id: number
  name: string
  color: string
  post_count?: number
}

export interface PostListItem {
  id: number
  title: string
  author: UserSummary
  comment_count: number
  like_count: number
  view_count: number
  pinned: boolean
  last_reply_at: number
  created_at: number
  tags: Tag[]
}

export interface Attachment {
  id: number
  filename: string
  url: string
  mime_type: string
  size: number
}

export interface VotingSummary {
  affirmative: number
  neutral: number
  negative: number
}

/** TipTap JSON document — opaque to the API layer; rendered by RichContent. */
export type TiptapDoc = { type: 'doc', content?: unknown[] }

export interface PostDetail {
  id: number
  title: string
  content_json: TiptapDoc
  content_text: string
  voting_enabled: boolean
  voting_summary?: VotingSummary
  liked: boolean
  author: UserSummary
  forum: { id: number, name: string, slug: string }
  tags: Tag[]
  comment_count: number
  like_count: number
  view_count: number
  pinned: boolean
  locked: boolean
  created_at: number
  last_reply_at: number
  attachments: Attachment[]
}

/** Comment attitude when the parent post has voting enabled: 1=affirm / 2=neutral / 3=negative. */
export type CommentAttitude = 1 | 2 | 3

export interface CommentItem {
  id: number
  parent_id?: number
  author: UserSummary
  content: string
  attitude: CommentAttitude
  like_count: number
  created_at: number
}

export interface LikedPostItem {
  id: number
  title: string
  author: UserSummary
  forum: { id: number, name: string, slug: string }
  like_count: number
  comment_count: number
  view_count: number
  created_at: number
  liked_at: number
}

export type ServerType = 'mc-java' | 'mc-bedrock' | 'dst' | 'terraria' | string

export interface ServerEndpoint {
  /** Optional human label for multi-endpoint setups (国内高防 / 海外直连 / IPv6 …). */
  label?: string
  /** Hostname or IP. Always present for endpoint-based games (JE / BE / Terraria). */
  host: string
  /** Optional port. Omit when it equals the game's default (JE 25565 / BE 19132 / Terraria 7777). */
  port?: number
}

/** Polymorphic per-game meta payload. Backend stores this as opaque JSONB. */
export interface McJavaMeta {
  endpoints?: ServerEndpoint[]
  mode?: string
  seed?: string
  whitelist?: boolean
  motd?: string
  [key: string]: unknown
}
export interface McBedrockMeta {
  endpoints?: ServerEndpoint[]
  world_name?: string
  gamemode?: string
  [key: string]: unknown
}
export interface DstMeta {
  /** DST clients join via the in-game browser; show the search name instead of host:port. */
  find_by_name?: string
  password_hint?: string
  game_mode?: string
  season?: string
  mods?: string[]
  [key: string]: unknown
}
export interface TerrariaMeta {
  endpoints?: ServerEndpoint[]
  world?: string
  difficulty?: string
  [key: string]: unknown
}
export interface GenericServerMeta {
  endpoints?: ServerEndpoint[]
  [key: string]: unknown
}
export type ServerMeta = McJavaMeta | McBedrockMeta | DstMeta | TerrariaMeta | GenericServerMeta

export interface ServerSummary {
  id: number
  name: string
  type: ServerType
  icon: string
  status: 'online' | 'offline' | 'maintenance'
  online: number
  max: number
  meta?: ServerMeta
}

export interface ServerDetail extends ServerSummary {
  description: string
  players: string[]
}

export interface OnlineStatPoint {
  recorded_at: number
  online: number
}

export interface LeaderboardItem {
  rank: number
  name: string
  score: number
}

export interface MetricChampion {
  metric: string
  name: string
  score: number
}

export interface DonationItem {
  display_name: string
  amount: number
  public: boolean
  donated_at: number
  message?: string
}

export interface CheckInResult {
  streak: number
  reward: { type: string, amount: number }
}

export interface CheckInCalendar {
  month: string
  streak: number
  days: { date: string, checked: boolean }[]
}

export interface BindCode {
  code: string
  expires_at: number
}

export interface BindStatus {
  bound: boolean
  player?: { name: string, bound_at: number }
}

export interface PlayerStats {
  name: string
  stats: Record<string, number>
  cached_at: number
}

export interface SearchResults {
  posts?: { id: number, title: string, forum_slug: string, author: UserSummary, created_at: number }[]
  users?: { id: number, username: string, avatar: string }[]
  servers?: { id: number, name: string, type: string, icon: string }[]
}

export interface Log {
  id: number
  actor_id?: number
  actor_name?: string
  action: string
  target_type?: string
  target_id?: string
  ip?: string
  user_agent?: string
  detail?: unknown
  created_at: number | string
}

export interface AuditLog {
  id: number
  server_id: number
  player_name: string
  action: string
  target_name?: string
  pos_x?: number
  pos_y?: number
  pos_z?: number
  detail?: unknown
  timestamp: number | string
}
