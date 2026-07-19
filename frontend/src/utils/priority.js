export const PRIORITY_COLORS = {
  Low: { text: 'text-emerald-400', bg: 'bg-emerald-400', ring: 'ring-emerald-400/30' },
  Medium: { text: 'text-alert-amber', bg: 'bg-alert-amber', ring: 'ring-alert-amber/30' },
  High: { text: 'text-orange-500', bg: 'bg-orange-500', ring: 'ring-orange-500/30' },
  Critical: { text: 'text-alert-red', bg: 'bg-alert-red', ring: 'ring-alert-red/30' },
}

export function priorityStyles(priority) {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium
}

export function formatConfidence(confidence) {
  return `${Math.round((confidence ?? 0) * 100)}%`
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
