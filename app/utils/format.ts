/** Format helpers — kept small and side-effect-free. */

export function relativeTime(unixSeconds: number, nowSeconds = Math.floor(Date.now() / 1000)): { kind: 'just_now' | 'minutes_ago' | 'hours_ago' | 'days_ago' | 'date', n?: number, date?: string } {
  const diff = Math.max(0, nowSeconds - unixSeconds)
  if (diff < 60) return { kind: 'just_now' }
  if (diff < 3600) return { kind: 'minutes_ago', n: Math.floor(diff / 60) }
  if (diff < 86_400) return { kind: 'hours_ago', n: Math.floor(diff / 3600) }
  if (diff < 86_400 * 30) return { kind: 'days_ago', n: Math.floor(diff / 86_400) }
  const d = new Date(unixSeconds * 1000)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return { kind: 'date', date: `${yyyy}-${mm}-${dd}` }
}

export function formatDate(unixSeconds: number) {
  if (!unixSeconds) return ''
  const d = new Date(unixSeconds * 1000)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const MM = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}`
}

export function formatNumber(n: number) {
  if (n < 1000) return String(n)
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return Math.round(n / 1000) + 'k'
}

export function truncate(s: string, max: number) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

const initialColors = [
  '#28abce', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

export function colorForName(name: string) {
  if (!name) return initialColors[0]!
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return initialColors[Math.abs(h) % initialColors.length]!
}

export function initials(name: string) {
  if (!name) return '?'
  const trimmed = name.trim()
  // CJK or other non-ASCII: take first character.
  if (/[^ -~]/.test(trimmed)) return trimmed.slice(0, 1)
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}
