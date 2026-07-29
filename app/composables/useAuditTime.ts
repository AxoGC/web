import { auditTimeParts } from '~/utils/format'

/** Translates auditTimeParts() into a display string using the app's active locale. */
export function useAuditTime() {
  const { t, locale } = useI18n()

  function formatAuditTimestamp(date: Date): string {
    const p = auditTimeParts(date, locale.value)
    switch (p.kind) {
      case 'today': return p.time
      case 'yesterday': return `${t('common.yesterday')} ${p.time}`
      case 'day_before_yesterday': return `${t('common.day_before_yesterday')} ${p.time}`
      case 'days_ago': return `${t('common.days_ago', { n: p.n })} ${p.time}`
      case 'dated': return `${p.datePart} ${p.time}`
    }
  }

  return { formatAuditTimestamp }
}
