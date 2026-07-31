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
  /** Optional profile-page top-card background image. Empty/absent when
   *  the user hasn't uploaded one — frontend renders the plain card. */
  background?: string
  bio: string
  /** GB/T 2260 prefecture-level code; absent when the user hasn't opted in
   *  to a public city. Resolve name/coords via /data/city-coords.json. */
  city_code?: string
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
  /** Live online flag from the most recent server heartbeat. */
  is_online?: boolean
  /** Unix seconds; 0 means "never". Set when the player is currently online. */
  joined_at?: number
  /** Unix seconds; 0 means "never". Set whenever the player was last present. */
  last_seen_at?: number
}

export interface UserProfileStats {
  checkin_streak: number
  checkin_total: number
  forum_post_count: number
  forum_comment_count: number
  forum_likes_received: number
}

/** One entry of GET /api/users/:id/posts — newest-first user posts shown on
 *  the profile page's "发帖" tab. Excludes body content. */
export interface UserRecentPost {
  id: number
  title: string
  comment_count: number
  like_count: number
  view_count: number
  created_at: number
}

/** One entry of GET /api/users/:id/comments — newest-first user comments shown
 *  on the profile page's "评论" tab. PostTitle is denormalized for linking. */
export interface UserRecentComment {
  id: number
  post_id: number
  post_title: string
  content_excerpt: string
  created_at: number
}

export interface FollowStats {
  follower_count: number
  following_count: number
  /** Present only when the request was authenticated and the viewer is not the target. */
  is_following?: boolean
}

export interface UserListPage {
  items: UserSummary[]
  total: number
  page: number
  size: number
}

export interface MeDTO extends PublicUser {
  email: string
  email_verified: boolean
  status: string
  /** Site-wide point balance — see promotion claims / VIP debit. */
  point: number
  /** Unix timestamp of the last self-service username rename, if any. */
  username_renamed_at?: number
}

export interface CityMapEntry {
  city_code: string
  count: number
  users: UserSummary[]
}

export interface ForumLatestPost {
  id: number
  title: string
  author: UserSummary
  created_at: number
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
  comment_count: number
  view_count: number
  latest_post?: ForumLatestPost | null
}

export interface Tag {
  id: number
  name: string
  color: string
  post_count?: number
}

export interface PostLatestReply {
  author: UserSummary
  content_excerpt: string
  created_at: number
}

export interface PostListItem {
  id: number
  title: string
  author: UserSummary
  comment_count: number
  like_count: number
  view_count: number
  pinned: boolean
  locked: boolean
  last_reply_at: number
  created_at: number
  tags: Tag[]
  latest_reply?: PostLatestReply | null
}

export interface FeedPostItem {
  id: number
  title: string
  author: UserSummary
  forum: { id: number, name: string, slug: string }
  comment_count: number
  view_count: number
  created_at: number
}

export interface SiteStats {
  post_count: number
  comment_count: number
  view_count: number
  user_count: number
}

export interface Attachment {
  id: number
  filename: string
  url: string
  mime_type: string
  size: number
}

export interface Carousel {
  id: number
  image_url: string
  caption: string
  link_url: string
  sort: number
  active: boolean
  updated_at: string
}

export interface PollOption {
  id: number
  label: string
  sort_order: number
}

export interface PollOptionCount {
  option_id: number
  count: number
}

export interface VotingSummary {
  counts: PollOptionCount[]
  total: number
}

/** TipTap JSON document — opaque to the API layer; rendered by RichContent. */
export type TiptapDoc = { type: 'doc', content?: unknown[] }

export interface PostDetail {
  id: number
  title: string
  content_json: TiptapDoc
  content_text: string
  voting_enabled: boolean
  poll_options?: PollOption[]
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

export interface CommentItem {
  id: number
  parent_id?: number
  author: UserSummary
  content: string
  poll_option_id?: number
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
  /**
   * Which client this endpoint is for, on a multi-type server (e.g. a
   * mc-java server also reachable via mc-bedrock) where Java and Bedrock
   * connect through genuinely different addresses, not just different
   * ports on the same host. Omitted (or on a single-type server) means the
   * endpoint is shown under every connect card that's rendered.
   */
  type?: 'mc-java' | 'mc-bedrock'
}

/** Polymorphic per-game meta payload. Backend stores this as opaque JSONB. */
export interface McJavaMeta {
  endpoints?: ServerEndpoint[]
  mode?: string
  seed?: string
  whitelist?: boolean
  motd?: string
  /** BlueMap web viewer URL. When set, the detail page embeds it in an iframe. */
  bluemap_url?: string
  /** Open-ended bag for ad-hoc keys the admin may add (e.g. dynmap_url). */
  extras?: Record<string, unknown>
}
export interface McBedrockMeta {
  endpoints?: ServerEndpoint[]
  world_name?: string
  gamemode?: string
  /** BlueMap web viewer URL. When set, the detail page embeds it in an iframe. */
  bluemap_url?: string
  /** Open-ended bag for ad-hoc keys the admin may add (e.g. dynmap_url). */
  extras?: Record<string, unknown>
}
export interface DstMeta {
  /** DST clients join via the in-game browser; show the search name instead of host:port. */
  find_by_name?: string
  password_hint?: string
  game_mode?: string
  season?: string
  mods?: string[]
  /** Open-ended bag for ad-hoc keys the admin may add (e.g. dynmap_url). */
  extras?: Record<string, unknown>
}
export interface TerrariaMeta {
  endpoints?: ServerEndpoint[]
  world?: string
  difficulty?: string
  /** Open-ended bag for ad-hoc keys the admin may add (e.g. dynmap_url). */
  extras?: Record<string, unknown>
}
export interface GenericServerMeta {
  endpoints?: ServerEndpoint[]
  /** Open-ended bag for ad-hoc keys the admin may add (e.g. dynmap_url). */
  extras?: Record<string, unknown>
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

/**
 * Server description is a TipTap-style JSON document (or null when empty).
 * Rendered via <RichContent>; edited via <RichEditor>. The frontend never
 * needs to display this as plain text, so no text mirror is stored on
 * either side.
 */
export type ServerDescriptionDoc = Record<string, unknown> | null

export interface ServerDetail extends ServerSummary {
  description: ServerDescriptionDoc
  players: string[]
}

/**
 * Admin-only view: same shape as ServerSummary but always carries description
 * and full (un-stripped) Meta — including the `_internal` envelope holding
 * backend-only credentials. Returned by `/api/admin/servers`.
 */
export interface AdminServerItem extends ServerSummary {
  description: ServerDescriptionDoc
  /** When false, the server is hidden from /api/servers and its public detail. */
  visible: boolean
}

export interface OnlineStatPoint {
  recorded_at: number
  online: number
  players?: string[]
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
  user_id?: number
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

/**
 * One axis of the unified stats radar. Plugins compute `percent` against a
 * fixed scale baseline they own; the order of the `stats` array is also the
 * intended display / axis order. The web side never knows the scales, so
 * tuning the radar is a pure plugin-side change.
 */
export interface StatsAxis {
  key: string
  unit: string
  value: number
  percent: number
}

export interface PlayerStats {
  name: string
  stats: StatsAxis[]
  source?: string
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

/**
 * Behavior-log query requests. One request = one category ("一锤定音" — a
 * single lookup, not an iterative investigation; repeated verification means
 * submitting another request). Metadata is always public regardless of
 * status; `rows` can hold up to 5000 entries, so the backend only ever
 * attaches it to the single-item GET (never the list) — fetch by id to
 * populate it, don't expect it on items returned from the list endpoint.
 */
export type LogCategory = 'block' | 'kill' | 'player_presence' | 'container' | 'chat'
export type LogQueryStatus = 'pending' | 'approved' | 'rejected'

/** Category-specific filter keys — see useLogCategories() for the whitelist per category. */
export interface LogQueryFilters {
  action?: string
  block_id?: string
  world?: string
  entity_type?: string
  /** JSON-encoded [[xMin,xMax],[yMin,yMax],[zMin,zMax]] bounding box. */
  pos_range?: string
}

export interface LogQueryRequestItem {
  id: number
  requester_user_id: number
  requester_username?: string
  target_server_id: number
  target_player: string
  category: LogCategory
  reason: string
  /** Unix seconds; 0/absent means unbounded. */
  from_ts?: number
  to_ts?: number
  filters?: LogQueryFilters
  status: LogQueryStatus
  /** Present only once rejected — the admin's reason, if they gave one. */
  reject_reason?: string
  approved_from_ts?: number
  approved_to_ts?: number
  approved_filters?: LogQueryFilters
  reviewed_by_user_id?: number
  reviewed_at?: number
  created_at: number
  /** Present only once approved — the frozen snapshot, shape depends on category. */
  rows?: Record<string, unknown>[]
}

export type PromotionClaimStatus = 'granted' | 'revoked'

export interface PromotionClaimItem {
  id: number
  user_id: number
  username?: string
  description_json: TiptapDoc
  description_text: string
  points: number
  status: PromotionClaimStatus
  /** Present only once revoked. */
  revoke_reason?: string
  revoke_penalty?: number
  reviewed_by_user_id?: number
  reviewed_at?: number
  created_at: number
}
