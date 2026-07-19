import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, FileDown, Loader2 } from 'lucide-react'
import { priorityStyles, formatDate } from '../utils/priority'
import { downloadReportPdf } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants/roles'

export default function IncidentCard({ incident, onDelete }) {
  const styles = priorityStyles(incident.priority)
  const { role } = useAuth()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (e) => {
    e.preventDefault()
    setDownloading(true)
    try {
      const blob = await downloadReportPdf(incident.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `incident-${incident.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      // Silent -- the PDFButton on the Result page surfaces a visible
      // error state; this compact card icon just no-ops on failure.
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="glass-card group overflow-hidden">
      <Link to={`/result/${incident.id}`} className="block">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={incident.image_url}
            alt={incident.incident_type}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase ring-1 backdrop-blur ${styles.text} ${styles.ring} bg-navy/70`}
          >
            {incident.priority}
          </span>
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold capitalize">
            {incident.incident_type?.replace(/_/g, ' ')}
          </h3>
          <span className="font-mono text-xs text-paper/50">{incident.score}/100</span>
        </div>
        <p className="line-clamp-2 text-sm text-paper/60">{incident.summary}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-[11px] text-paper/40">{formatDate(incident.created_at)}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg p-2 text-paper/60 hover:bg-navy-light hover:text-scan-cyan disabled:opacity-50"
              aria-label="Download PDF report"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            </button>
            {role === ROLES.ADMIN && (
              <button
                type="button"
                onClick={() => onDelete(incident.id)}
                className="rounded-lg p-2 text-paper/60 hover:bg-navy-light hover:text-alert-red"
                aria-label="Delete incident"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
