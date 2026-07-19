import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { downloadReportPdf } from '../services/api'

export default function PDFButton({ incidentId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      const blob = await downloadReportPdf(incidentId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `incident-${incidentId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Could not download the report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDownload} disabled={loading} className="btn-secondary disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
        {loading ? 'Preparing…' : 'Download PDF Report'}
      </button>
      {error && <p className="mt-2 text-xs text-alert-red">{error}</p>}
    </div>
  )
}
