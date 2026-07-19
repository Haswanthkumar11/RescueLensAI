import { CheckCircle2 } from 'lucide-react'

function formatTimestamp(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function IncidentTimeline({ events }) {
  if (!events || events.length === 0) return null

  return (
    <div className="glass-card p-6">
      <p className="eyebrow mb-5">Incident timeline</p>
      <ol className="space-y-0">
        {events.map((ev, i) => (
          <li key={ev.stage || i} className="relative flex gap-4 pb-6 last:pb-0">
            {i < events.length - 1 && (
              <span className="absolute left-[9px] top-6 h-full w-px bg-navy-border" aria-hidden="true" />
            )}
            <span className="relative z-10 mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-scan-cyan/15 text-scan-cyan">
              <CheckCircle2 size={14} />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm text-paper/80">{ev.label}</span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-paper/40">
                <span>{formatTimestamp(ev.timestamp)}</span>
                {ev.duration_ms != null && <span className="text-paper/30">+{ev.duration_ms}ms</span>}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
