import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts'
import { Search, PlusCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import IncidentCard from '../components/IncidentCard'
import { fetchHistory, deleteIncident } from '../services/api'

const PIE_COLORS = ['#DC2626', '#F59E0B', '#2DD4BF', '#64748B', '#16A34A']
const PRIORITY_ORDER = ['Low', 'Medium', 'High', 'Critical']

export default function History() {
  const { role } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isViewer = role === 'viewer'
  const pageTitle = isViewer ? 'My Incident History' : 'Incident history'
  const pageEyebrow = isViewer ? 'My Reports' : 'Dashboard'

  useEffect(() => {
    fetchHistory()
      .then(setIncidents)
      .catch(() => setError('Could not load history. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    const prev = incidents
    setIncidents((cur) => cur.filter((i) => i.id !== id))
    try {
      await deleteIncident(id)
    } catch (key) {
      setIncidents(prev) // revert on failure
    }
  }

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const matchesQuery =
        !query ||
        i.incident_type?.toLowerCase().includes(query.toLowerCase()) ||
        i.summary?.toLowerCase().includes(query.toLowerCase())
      const matchesFilter = filter === 'All' || i.priority === filter
      return matchesQuery && matchesFilter
    })
  }, [incidents, query, filter])

  const typeData = useMemo(() => {
    const counts = {}
    incidents.forEach((i) => {
      counts[i.incident_type] = (counts[i.incident_type] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [incidents])

  const priorityData = useMemo(() => {
    const counts = Object.fromEntries(PRIORITY_ORDER.map((p) => [p, 0]))
    incidents.forEach((i) => { if (counts[i.priority] !== undefined) counts[i.priority]++ })
    return PRIORITY_ORDER.map((name) => ({ name, value: counts[name] }))
  }, [incidents])

  const dailyData = useMemo(() => {
    const counts = {}
    incidents.forEach((i) => {
      const day = new Date(i.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      counts[day] = (counts[day] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [incidents])

  const criticalCount = incidents.filter((i) => i.priority === 'Critical').length
  const avgScore = incidents.length
    ? Math.round(incidents.reduce((sum, i) => sum + i.score, 0) / incidents.length)
    : 0

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow mb-2">{pageEyebrow}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{pageTitle}</h1>
        </div>
        {isViewer && (
          <Link to="/upload" className="btn-primary w-fit">
            <PlusCircle size={18} /> Report New Incident
          </Link>
        )}
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={isViewer ? "My total reports" : "Total incidents"} value={incidents.length} />
        <StatCard label="Critical" value={criticalCount} accent="text-alert-red" />
        <StatCard label="Avg. risk score" value={avgScore} accent="text-alert-amber" />
        <StatCard label="Resolved" value="—" />
      </div>

      {incidents.length > 0 && (
        <div className="mb-10 grid gap-5 lg:grid-cols-3">
          <div className="glass-card p-5">
            <p className="eyebrow mb-4">Emergency types</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1E293B' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <p className="eyebrow mb-4">Priority distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1E293B' }} />
                <Bar dataKey="value" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <p className="eyebrow mb-4">Incidents per day</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1E293B' }} />
                <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search incidents…"
            className="w-full rounded-xl border border-navy-border bg-navy-light/60 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-scan-cyan/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...PRIORITY_ORDER].map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                filter === p ? 'bg-scan-cyan/15 text-scan-cyan ring-1 ring-scan-cyan/40' : 'text-paper/50 hover:text-paper'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-paper/60">Loading incidents…</p>}
      {error && <p className="text-alert-red">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="rounded-xl border border-navy-border bg-navy-light/40 p-8 text-center text-paper/50">
          No incidents match your filters yet.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} onDelete={handleDelete} />
        ))}
      </div>
    </section>
  )
}
