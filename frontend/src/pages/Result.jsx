import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { AlertTriangle, Users, Flame, Waves, Baby, HeartPulse } from 'lucide-react'
import RiskMeter from '../components/RiskMeter'
import PDFButton from '../components/PDFButton'
import IncidentTimeline from '../components/IncidentTimeline'
import { fetchIncident } from '../services/api'
import { formatConfidence, formatDate } from '../utils/priority'

const DETECTION_ICONS = {
  fire: Flame,
  flood: Waves,
  children: Baby,
  injured: HeartPulse,
}

export default function Result() {
  const { id } = useParams()
  const location = useLocation()
  const [incident, setIncident] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (location.state) return
    fetchIncident(id)
      .then(setIncident)
      .catch(() => setError('Could not load this incident.'))
      .finally(() => setLoading(false))
  }, [id, location.state])

  if (loading) {
    return <p className="mx-auto max-w-2xl px-6 py-20 text-center text-paper/60">Loading incident…</p>
  }
  if (error || !incident) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-alert-red">{error || 'Incident not found.'}</p>
        <Link to="/upload" className="btn-secondary mt-6 inline-flex">Analyze another image</Link>
      </div>
    )
  }

  // Normalize: fresh /analyze response has {analysis, risk, ...}; a
  // fetched history row is a flat incident dict. Support both shapes.
  const isFresh = Boolean(incident.analysis)
  const imageUrl = incident.image_url
  const priority = isFresh ? incident.risk.priority : incident.priority
  const score = isFresh ? incident.risk.score : incident.score
  const incidentType = isFresh ? incident.analysis.incident : incident.incident_type
  const severity = isFresh ? incident.analysis.severity : incident.severity
  const summary = isFresh ? incident.analysis.summary : incident.summary
  const team = isFresh ? incident.recommended_team : incident.response_team
  const confidence = isFresh ? incident.analysis.confidence : incident.confidence
  // History-fetched incidents now carry a normalized `detections` object
  // too (see supabase_client.get_incident), so both branches share one shape.
  const detections = isFresh ? incident.analysis.detections : incident.detections
  const incidentId = isFresh ? incident.incident_id : incident.id
  const createdAt = incident.created_at
  const timeline = incident.timeline

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <p className="eyebrow mb-3">Analysis complete</p>
      <h1 className="mb-8 text-3xl font-bold capitalize sm:text-4xl">
        {incidentType?.replace(/_/g, ' ')} — {severity}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass-card overflow-hidden">
          <img src={imageUrl} alt={incidentType} className="max-h-[420px] w-full object-cover" />
        </div>

        <div className="space-y-6">
          <RiskMeter score={score} priority={priority} />
          <div className="glass-card p-5">
            <p className="eyebrow mb-2">Recommended response</p>
            <p className="flex items-center gap-2 font-display text-lg font-semibold">
              <Users size={18} className="text-scan-cyan" /> {team}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="eyebrow mb-2">AI confidence</p>
            <p className="font-display text-lg font-semibold">{formatConfidence(confidence)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass-card p-6">
          <p className="eyebrow mb-3">Incident summary</p>
          <p className="leading-relaxed text-paper/80">{summary}</p>
          <p className="mt-4 font-mono text-xs text-paper/40">Logged {formatDate(createdAt)}</p>
        </div>

        {detections && (
          <div className="glass-card p-6">
            <p className="eyebrow mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> Detected hazards
            </p>
            <ul className="space-y-2 text-sm">
              {Object.entries(detections)
                .filter(([, v]) => v === true || (typeof v === 'number' && v > 0))
                .map(([key, value]) => {
                  const Icon = DETECTION_ICONS[key] || AlertTriangle
                  return (
                    <li key={key} className="flex items-center justify-between rounded-lg bg-navy-light/60 px-3 py-2">
                      <span className="flex items-center gap-2 capitalize text-paper/80">
                        <Icon size={15} className="text-alert-amber" />
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-xs text-paper/50">
                        {typeof value === 'number' ? value : 'yes'}
                      </span>
                    </li>
                  )
                })}
            </ul>
          </div>
        )}
      </div>

      {timeline && timeline.length > 0 && (
        <div className="mt-8">
          <IncidentTimeline events={timeline} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4">
        <PDFButton incidentId={incidentId} />
        <Link to="/upload" className="btn-secondary">Analyze another image</Link>
        <Link to="/history" className="btn-secondary">View dashboard</Link>
      </div>
    </section>
  )
}
