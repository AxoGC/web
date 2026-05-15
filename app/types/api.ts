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

export interface PostDetail {
  id: number
  title: string
  content: string
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
  like_count: number
  created_at: number
}

export interface ServerSummary {
  id: number
  name: string
  type: string
  host: string
  port: number
  icon: string
  status: 'online' | 'offline' | 'maintenance'
  online: number
  max: number
  meta?: Record<string, unknown>
}

export interface ServerDetail extends ServerSummary {
  description: string
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
