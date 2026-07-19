import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
} from 'recharts'
import {
  Search, ShieldAlert, Clock, AlertTriangle, CheckCircle, Flame,
  FileDown, RefreshCw, X, Eye, Play, Check, Heart, HelpCircle,
  Truck, Shield, EyeOff, Layers, Users, SlidersHorizontal, Settings
} from 'lucide-react'
import { fetchHistory, downloadReportPdf } from '../services/api'
import { formatDate } from '../utils/priority'
import StatCard from '../components/StatCard'

const COLORS = ['#DC2626', '#F59E0B', '#2DD4BF', '#64748B', '#16A34A', '#8B5CF6']
const PRIORITY_ORDER = ['Low', 'Medium', 'High', 'Critical']

const EQUIPMENT_SUGGESTIONS = {
  fire: ['Class-A Fire Engine', 'Thermal Cameras', 'SCBA Gear', 'Hydraulic Spreader'],
  flood: ['Swiftwater Rescue Boat', 'Pumping Equipment', 'PFDs & Waders', 'Sandbags'],
  building_collapse: ['K9 Search Units', 'Structural Shoring Kit', 'Acoustic Sensors', 'Concrete Saws'],
  vehicle_accident: ['Extrication Jaws of Life', 'EMS First Response Kit', 'Traffic Control Pack'],
  other: ['General First Aid Responder Kit', 'Hazmat Isolation Pack'],
}

const LOCATION_MOCKS = [
  'Sector 4 Emergency Grid',
  'Highway 18 Milepost 42',
  'Metropolitan Plaza',
  'Industrial District Block C',
  'North River Basin Grid 3',
  'Downtown Commercial Corridor'
]

export default function ResponderDashboard() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIncident, setSelectedIncident] = useState(null)
  
  // LocalStorage state for statuses to make the actions interactive without altering DB schema
  const [incidentStatuses, setIncidentStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('rl_incident_statuses')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // LocalStorage state for Activity Log Feed
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('rl_incident_activities')
      return saved ? JSON.parse(saved) : [
        { time: '09:30', text: 'Structure Fire incident reported', type: 'fire' },
        { time: '09:36', text: 'Responder accepted Medical Dispatch', type: 'medical' },
        { time: '09:41', text: 'Flood Rescue Team dispatched to Sector 2', type: 'flood' },
        { time: '09:52', text: 'Critical Incident #RL-7402 Resolved', type: 'resolved' },
      ]
    } catch {
      return []
    }
  })

  // Filter toolbar states
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [isExporting, setIsExporting] = useState(false)

  const loadData = () => {
    setLoading(true)
    setError(null)
    fetchHistory(100)
      .then((data) => {
        setIncidents(data)
      })
      .catch((err) => {
        setError('Failed to fetch emergency reports. Please check your connection.')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateStatus = (id, newStatus) => {
    const nextStatuses = { ...incidentStatuses, [id]: newStatus }
    setIncidentStatuses(nextStatuses)
    localStorage.setItem('rl_incident_statuses', JSON.stringify(nextStatuses))

    // Log this action to the activity feed
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const incident = incidents.find(i => i.id === id)
    const typeLabel = incident ? incident.incident_type.replace('_', ' ') : 'Incident'
    const newActivity = {
      time: timeStr,
      text: `${typeLabel.toUpperCase()} status updated to [${newStatus.toUpperCase()}]`,
      type: newStatus === 'Resolved' ? 'resolved' : 'dispatch'
    }
    const nextActivities = [newActivity, ...activities].slice(0, 15)
    setActivities(nextActivities)
    localStorage.setItem('rl_incident_activities', JSON.stringify(nextActivities))

    // Keep drawer in sync if open
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => ({ ...prev, status: newStatus }))
    }
  }

  // Populate statuses and location mock helpers
  const enrichedIncidents = useMemo(() => {
    return incidents.map((inc, index) => {
      const status = incidentStatuses[inc.id] || 'Pending'
      // Consistent location hashing based on ID
      const charCodeSum = inc.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
      const location = LOCATION_MOCKS[charCodeSum % LOCATION_MOCKS.length]
      return {
        ...inc,
        status,
        location
      }
    })
  }, [incidents, incidentStatuses])

  // Filters logic
  const filteredIncidents = useMemo(() => {
    return enrichedIncidents.filter((inc) => {
      const matchesSearch =
        !search ||
        inc.id.toLowerCase().includes(search.toLowerCase()) ||
        inc.incident_type.toLowerCase().includes(search.toLowerCase()) ||
        inc.summary.toLowerCase().includes(search.toLowerCase()) ||
        inc.location.toLowerCase().includes(search.toLowerCase())

      const matchesSeverity = severityFilter === 'All' || inc.severity.toLowerCase() === severityFilter.toLowerCase()
      const matchesPriority = priorityFilter === 'All' || inc.priority.toLowerCase() === priorityFilter.toLowerCase()
      const matchesStatus = statusFilter === 'All' || inc.status.toLowerCase() === statusFilter.toLowerCase()
      
      let matchesDate = true
      if (dateFilter !== 'All') {
        const incDate = new Date(inc.created_at)
        const today = new Date()
        if (dateFilter === 'Today') {
          matchesDate = incDate.toDateString() === today.toDateString()
        }
      }

      return matchesSearch && matchesSeverity && matchesPriority && matchesStatus && matchesDate
    })
  }, [enrichedIncidents, search, severityFilter, priorityFilter, statusFilter, dateFilter])

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = enrichedIncidents.length
    const pending = enrichedIncidents.filter(i => i.status === 'Pending').length
    const inProgress = enrichedIncidents.filter(i => i.status === 'In Progress').length
    const resolved = enrichedIncidents.filter(i => i.status === 'Resolved').length
    const highSeverity = enrichedIncidents.filter(i => i.severity === 'severe').length
    const criticalIncidents = enrichedIncidents.filter(i => i.priority === 'Critical').length
    
    return { total, pending, inProgress, resolved, highSeverity, criticalIncidents }
  }, [enrichedIncidents])

  // Statistics Computations
  const stats = useMemo(() => {
    const typesMap = {}
    const severityMap = { minor: 0, moderate: 0, severe: 0, catastrophic: 0 }
    const statusMap = { Pending: 0, Assigned: 0, 'In Progress': 0, Resolved: 0 }
    
    enrichedIncidents.forEach(inc => {
      // Types
      const t = inc.incident_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
      typesMap[t] = (typesMap[t] || 0) + 1
      
      // Severity
      if (severityMap[inc.severity] !== undefined) {
        severityMap[inc.severity]++
      }
      
      // Status
      if (statusMap[inc.status] !== undefined) {
        statusMap[inc.status]++
      }
    })

    const typeData = Object.entries(typesMap).map(([name, value]) => ({ name, value }))
    const severityData = Object.entries(severityMap).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }))
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

    // Hour graph
    const hourData = Array.from({ length: 6 }).map((_, idx) => {
      const label = `${idx * 4}:00`
      return { name: label, Incidents: 0 }
    })
    enrichedIncidents.forEach(inc => {
      const date = new Date(inc.created_at)
      const hour = date.getHours()
      const bucket = Math.floor(hour / 4)
      if (hourData[bucket]) {
        hourData[bucket].Incidents++
      }
    })

    return { typeData, severityData, statusData, hourData }
  }, [enrichedIncidents])

  // Active Response Teams Calculation
  const activePanels = useMemo(() => {
    const panels = [
      { name: 'Fire Response', icon: Flame, matchTypes: ['fire', 'smoke'], count: 0, critical: false },
      { name: 'Medical Rescue', icon: Heart, matchTypes: ['medical', 'injured'], count: 0, critical: false },
      { name: 'Road Incident', icon: Truck, matchTypes: ['vehicle_accident'], count: 0, critical: false },
      { name: 'Flood Team', icon: Shield, matchTypes: ['flood'], count: 0, critical: false },
      { name: 'USAR (Shocks)', icon: ShieldAlert, matchTypes: ['building_collapse', 'collapsed_building'], count: 0, critical: false }
    ]

    enrichedIncidents.forEach(inc => {
      if (inc.status !== 'Resolved') {
        const type = inc.incident_type.toLowerCase()
        const panel = panels.find(p => p.matchTypes.some(mt => type.includes(mt)))
        if (panel) {
          panel.count++
          if (inc.priority === 'Critical') {
            panel.critical = true
          }
        }
      }
    })
    return panels
  }, [enrichedIncidents])

  // PDF report downloader helper
  const handlePdfDownload = async (incidentId) => {
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
      alert('Could not download pdf report. Make sure the backend is active.')
    }
  }

  // Export report to CSV
  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Incident ID', 'Type', 'Severity', 'Priority', 'Location', 'Reported Time', 'Status', 'Summary']
      const rows = filteredIncidents.map(inc => [
        inc.id,
        inc.incident_type,
        inc.severity,
        inc.priority,
        inc.location,
        inc.created_at,
        inc.status,
        `"${inc.summary.replace(/"/g, '""')}"`
      ])
      
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `incident_report_export_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error(err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="relative min-h-[90vh] bg-navy text-paper px-6 py-8">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)] opacity-20 pointer-events-none" />

      {/* Header and Quick Actions */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-alert-red animate-pulse" />
            <p className="eyebrow !text-alert-red font-semibold">Emergency Operations Command Center</p>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">RescueLens Live Operations</h1>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={loadData} className="btn-secondary !py-2 !px-3.5 text-xs flex items-center gap-1.5 hover:scale-[1.02]">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Feed
          </button>
          <button onClick={handleExportCSV} disabled={isExporting || filteredIncidents.length === 0} className="btn-secondary !py-2 !px-3.5 text-xs flex items-center gap-1.5 hover:scale-[1.02] disabled:opacity-45">
            <FileDown size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* 1. Top KPI Cards */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Dispatches" value={loading ? '...' : kpis.total} />
        
        <div className="glass-card p-4 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-center mb-1 text-alert-amber">
            <Clock size={16} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Triage</span>
          </div>
          <p className="text-2xl font-bold font-mono">{loading ? '...' : kpis.pending}</p>
          <p className="text-[11px] text-paper/40 mt-1 uppercase font-mono tracking-wide">Pending</p>
        </div>

        <div className="glass-card p-4 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-center mb-1 text-scan-cyan">
            <SlidersHorizontal size={16} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Active</span>
          </div>
          <p className="text-2xl font-bold font-mono">{loading ? '...' : kpis.inProgress}</p>
          <p className="text-[11px] text-paper/40 mt-1 uppercase font-mono tracking-wide">In Progress</p>
        </div>

        <div className="glass-card p-4 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-center mb-1 text-green-500">
            <CheckCircle size={16} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Done</span>
          </div>
          <p className="text-2xl font-bold font-mono">{loading ? '...' : kpis.resolved}</p>
          <p className="text-[11px] text-paper/40 mt-1 uppercase font-mono tracking-wide">Resolved</p>
        </div>

        <div className="glass-card p-4 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-center mb-1 text-orange-500">
            <AlertTriangle size={16} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Severe</span>
          </div>
          <p className="text-2xl font-bold font-mono">{loading ? '...' : kpis.highSeverity}</p>
          <p className="text-[11px] text-paper/40 mt-1 uppercase font-mono tracking-wide">High Severity</p>
        </div>

        <div className="glass-card p-4 transition-all hover:-translate-y-1 border border-alert-red/30 bg-alert-red/5">
          <div className="flex justify-between items-center mb-1 text-alert-red">
            <ShieldAlert size={16} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Immediate</span>
          </div>
          <p className="text-2xl font-bold font-mono">{loading ? '...' : kpis.criticalIncidents}</p>
          <p className="text-[11px] text-paper/40 mt-1 uppercase font-mono tracking-wide">Critical</p>
        </div>
      </div>

      {/* Grid Dashboard */}
      <div className="relative z-10 grid lg:grid-cols-4 gap-6 mb-8">
        
        {/* Left 3 Columns: Main Content */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 4. Filters Toolbar */}
          <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Incident, Type, or Grid..."
                className="w-full rounded-xl border border-navy-border bg-navy px-9 py-2 text-xs text-paper placeholder-paper/30 outline-none transition focus:border-scan-cyan/40"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div>
                <label className="form-label !mb-1 text-[10px]">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="rounded-lg border border-navy-border bg-navy text-[11px] px-2 py-1 text-paper outline-none focus:border-scan-cyan/40"
                >
                  <option value="All">All Severities</option>
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Catastrophic">Catastrophic</option>
                </select>
              </div>

              <div>
                <label className="form-label !mb-1 text-[10px]">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-lg border border-navy-border bg-navy text-[11px] px-2 py-1 text-paper outline-none focus:border-scan-cyan/40"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="form-label !mb-1 text-[10px]">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-navy-border bg-navy text-[11px] px-2 py-1 text-paper outline-none focus:border-scan-cyan/40"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="form-label !mb-1 text-[10px]">Date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-lg border border-navy-border bg-navy text-[11px] px-2 py-1 text-paper outline-none focus:border-scan-cyan/40"
                >
                  <option value="All">All Time</option>
                  <option value="Today">Today Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Emergency Incident Queue Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-border flex justify-between items-center bg-navy-light/30">
              <h2 className="font-display font-bold text-sm tracking-wide uppercase text-scan-cyan">Live Incident Dispatch Queue</h2>
              <span className="font-mono text-xs text-paper/40">{filteredIncidents.length} Records Found</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy-border bg-navy text-paper/40 uppercase font-mono tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Thumbnail</th>
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Reported At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-border bg-navy-light/10">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-8 w-12 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-24 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-16 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-12 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-28 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-4 w-20 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4"><div className="h-6 w-16 rounded bg-navy-border" /></td>
                        <td className="py-4 px-4 text-right"><div className="h-7 w-20 ml-auto rounded bg-navy-border" /></td>
                      </tr>
                    ))
                  ) : filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-paper/40">
                        <SlidersHorizontal size={24} className="mx-auto mb-2 text-paper/20" />
                        No emergency incidents match current query filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc) => {
                      // Style configurations
                      const sevColors = {
                        minor: 'text-green-500 bg-green-500/10 border border-green-500/20',
                        moderate: 'text-alert-amber bg-alert-amber/10 border border-alert-amber/20',
                        severe: 'text-orange-500 bg-orange-500/10 border border-orange-500/20',
                        catastrophic: 'text-alert-red bg-alert-red/10 border border-alert-red/20'
                      }
                      
                      const prioColors = {
                        Low: 'bg-green-500/10 text-green-500',
                        Medium: 'bg-alert-amber/10 text-alert-amber',
                        High: 'bg-orange-500/10 text-orange-500',
                        Critical: 'bg-alert-red/20 text-alert-red font-bold'
                      }
                      
                      const statusColors = {
                        Pending: 'bg-paper/10 text-paper border border-paper/20',
                        Assigned: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
                        'In Progress': 'bg-scan-cyan/15 text-scan-cyan border border-scan-cyan/30',
                        Resolved: 'bg-green-500/10 text-green-500 border border-green-500/20'
                      }

                      return (
                        <tr key={inc.id} className="hover:bg-navy-light/35 transition group">
                          <td className="py-2.5 px-4">
                            <img
                              src={inc.image_url}
                              alt="Incident"
                              className="h-9 w-14 rounded object-cover border border-navy-border group-hover:border-scan-cyan/30 transition"
                            />
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-paper/85">
                            {inc.id.substring(0, 8)}...
                          </td>
                          <td className="py-2.5 px-4 font-mono font-medium text-paper/70">
                            {inc.incident_type.replace('_', ' ').toUpperCase()}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide ${sevColors[inc.severity] || 'bg-paper/5'}`}>
                              {inc.severity}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${prioColors[inc.priority] || 'bg-paper/5'}`}>
                              {inc.priority}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-paper/60 font-mono text-[11px]">
                            {inc.location}
                          </td>
                          <td className="py-2.5 px-4 text-paper/40 font-mono text-[11px]">
                            {formatDate(inc.created_at)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${statusColors[inc.status] || ''}`}>
                              {inc.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex gap-1 justify-end items-center">
                              <button
                                onClick={() => setSelectedIncident(inc)}
                                className="btn-secondary !py-1 !px-2 text-[10px] flex items-center gap-1 hover:border-scan-cyan/60"
                              >
                                <Eye size={12} /> View
                              </button>
                              
                              {inc.status === 'Pending' && (
                                <button
                                  onClick={() => updateStatus(inc.id, 'Assigned')}
                                  className="btn-primary !bg-blue-600 hover:!bg-blue-500 !py-1 !px-2 text-[10px] flex items-center gap-1"
                                >
                                  Accept
                                </button>
                              )}
                              
                              {inc.status === 'Assigned' && (
                                <button
                                  onClick={() => updateStatus(inc.id, 'In Progress')}
                                  className="btn-primary !bg-scan-cyan hover:!bg-teal-500 !text-navy !py-1 !px-2 text-[10px] flex items-center gap-1"
                                >
                                  <Play size={10} fill="currentColor" /> Dispatch
                                </button>
                              )}
                              
                              {inc.status === 'In Progress' && (
                                <button
                                  onClick={() => updateStatus(inc.id, 'Resolved')}
                                  className="btn-primary !bg-green-600 hover:!bg-green-500 !py-1 !px-2 text-[10px] flex items-center gap-1"
                                >
                                  <Check size={12} /> Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Statistics Section (Charts) */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Chart 1: Types */}
            <div className="glass-card p-5">
              <p className="eyebrow mb-4">Emergency Classification Distribution</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.typeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {stats.typeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1E293B', color: '#F8FAFC' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2 text-[10px] font-mono text-paper/50">
                {stats.typeData.map((t, idx) => (
                  <span key={t.name} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    {t.name} ({t.value})
                  </span>
                ))}
              </div>
            </div>

            {/* Chart 2: Timeline dispatch loads */}
            <div className="glass-card p-5">
              <p className="eyebrow mb-4">Incident Log Loads (Triage Frequency)</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.hourData}>
                    <defs>
                      <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1E293B' }} />
                    <Area type="monotone" dataKey="Incidents" stroke="#2DD4BF" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>

        {/* Right 1 Column: Sidebar Panels */}
        <div className="space-y-6">

          {/* 6. Active Response Panel */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-xs tracking-wide uppercase text-paper/85 border-b border-navy-border pb-3 mb-4">
              Dispatcher Deployment Status
            </h3>
            
            <div className="space-y-3">
              {activePanels.map((p) => {
                const Icon = p.icon
                return (
                  <div key={p.name} className="flex items-center justify-between p-3 rounded-xl border border-navy-border bg-navy/40">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${p.count > 0 ? 'bg-scan-cyan/10 text-scan-cyan' : 'bg-paper/5 text-paper/30'}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-paper/80">{p.name}</p>
                        <p className="text-[9px] font-mono text-paper/40 uppercase">Active Dispatch</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {p.critical && p.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-alert-red/25 border border-alert-red/35 text-alert-red font-mono text-[9px] font-bold animate-pulse">
                          CRIT
                        </span>
                      )}
                      <span className="font-mono text-sm font-bold text-paper">
                        {p.count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 7. Recent Activity Feed */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-xs tracking-wide uppercase text-paper/85 border-b border-navy-border pb-3 mb-4">
              Real-time Logs
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {activities.map((act, idx) => {
                // Color codes
                let bulletBg = 'bg-paper/20 text-paper/50'
                if (act.type === 'resolved') bulletBg = 'bg-green-500/10 text-green-500 border border-green-500/30'
                if (act.type === 'fire') bulletBg = 'bg-alert-red/10 text-alert-red border border-alert-red/30'
                if (act.type === 'dispatch') bulletBg = 'bg-scan-cyan/15 text-scan-cyan border border-scan-cyan/30'

                return (
                  <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                    <div className="flex flex-col items-center">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${bulletBg}`}>
                        !
                      </span>
                      {idx < activities.length - 1 && <span className="w-[1px] flex-1 bg-navy-border my-1" />}
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-paper/35">{act.time}</p>
                      <p className="text-[11px] text-paper/75 font-mono">{act.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Detailed Incident Drawer / Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-navy-light/95 border-l border-navy-border h-full flex flex-col shadow-2xl relative animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-navy-border flex justify-between items-center bg-navy">
              <div>
                <p className="eyebrow font-mono text-[10px]">Triage Case Profile</p>
                <h3 className="font-display text-lg font-bold text-paper">Incident Details Drawer</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="h-8 w-8 rounded-lg bg-paper/5 flex items-center justify-center hover:bg-paper/10 text-paper/60 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Primary Image View */}
              <div className="relative rounded-2xl overflow-hidden border border-navy-border aspect-[16/9] bg-navy flex items-center justify-center">
                <img
                  src={selectedIncident.image_url}
                  alt="Incident Dispatch File"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-navy/70 border border-navy-border rounded-lg px-2.5 py-1 text-[10px] font-mono text-scan-cyan uppercase">
                  Confidence: {Math.round(selectedIncident.confidence * 100)}%
                </span>
              </div>

              {/* Status Update Actions inside Drawer */}
              <div className="p-4 rounded-xl border border-navy-border bg-navy/30 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-paper/40 block">Operational Status</span>
                  <span className="text-xs font-mono font-bold text-scan-cyan">{selectedIncident.status}</span>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => updateStatus(selectedIncident.id, 'Assigned')}
                    disabled={selectedIncident.status === 'Assigned' || selectedIncident.status === 'In Progress' || selectedIncident.status === 'Resolved'}
                    className="btn-secondary !py-1.5 !px-2.5 text-[11px] disabled:opacity-40"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(selectedIncident.id, 'In Progress')}
                    disabled={selectedIncident.status === 'In Progress' || selectedIncident.status === 'Resolved'}
                    className="btn-secondary !py-1.5 !px-2.5 text-[11px] disabled:opacity-40"
                  >
                    Dispatch
                  </button>
                  <button
                    onClick={() => updateStatus(selectedIncident.id, 'Resolved')}
                    disabled={selectedIncident.status === 'Resolved'}
                    className="btn-primary !py-1.5 !px-2.5 text-[11px] disabled:opacity-40"
                  >
                    Resolve Case
                  </button>
                </div>
              </div>

              {/* AI Dispatch Summary */}
              <div>
                <h4 className="font-display font-semibold text-xs text-paper/45 uppercase tracking-wider mb-2">AI Dispatch Assessment</h4>
                <p className="text-xs leading-relaxed text-paper/80 font-mono bg-navy/30 border border-navy-border p-4 rounded-xl">
                  {selectedIncident.summary}
                </p>
              </div>

              {/* Details Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-navy-border bg-navy/35">
                  <span className="text-[10px] text-paper/40 uppercase font-mono block mb-1">Recommended Team</span>
                  <span className="text-xs font-bold text-paper">{selectedIncident.response_team}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-navy-border bg-navy/35">
                  <span className="text-[10px] text-paper/40 uppercase font-mono block mb-1">Assessed Severity</span>
                  <span className="text-xs font-bold text-paper capitalize">{selectedIncident.severity}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-navy-border bg-navy/35">
                  <span className="text-[10px] text-paper/40 uppercase font-mono block mb-1">Assessed Priority</span>
                  <span className="text-xs font-bold text-paper">{selectedIncident.priority} (Score: {selectedIncident.score}/100)</span>
                </div>
                <div className="p-3.5 rounded-xl border border-navy-border bg-navy/35">
                  <span className="text-[10px] text-paper/40 uppercase font-mono block mb-1">Dispatch Location</span>
                  <span className="text-xs font-bold text-paper">{selectedIncident.location}</span>
                </div>
              </div>

              {/* Detected Hazards & Equipment List */}
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Hazards */}
                <div>
                  <h4 className="font-display font-semibold text-xs text-paper/45 uppercase tracking-wider mb-2">Detected Hazards</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedIncident.detections ? (
                      Object.entries(selectedIncident.detections)
                        .filter(([k, v]) => v === true || (k === 'people_detected' && v > 0))
                        .map(([k, v]) => (
                          <span key={k} className="px-2 py-1 rounded bg-alert-red/10 border border-alert-red/20 text-alert-red font-mono text-[9px] uppercase font-bold tracking-wide">
                            {k === 'people_detected' ? `PEOPLE: ${v}` : k.replace('_', ' ')}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs font-mono text-paper/40">No individual signals cataloged</span>
                    )}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h4 className="font-display font-semibold text-xs text-paper/45 uppercase tracking-wider mb-2">Suggested Equipment Deployment</h4>
                  <div className="flex flex-wrap gap-1">
                    {(EQUIPMENT_SUGGESTIONS[selectedIncident.incident_type] || EQUIPMENT_SUGGESTIONS.other).map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded bg-scan-cyan/10 border border-scan-cyan/20 text-scan-cyan font-mono text-[9px] uppercase font-bold tracking-wide">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Timeline Section */}
              {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                <div>
                  <h4 className="font-display font-semibold text-xs text-paper/45 uppercase tracking-wider mb-3">Triage Processing Timeline</h4>
                  <div className="space-y-3 font-mono text-[10px] border-l border-navy-border ml-2 pl-4">
                    {selectedIncident.timeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[20.5px] top-1 h-2.5 w-2.5 rounded-full bg-scan-cyan" />
                        <span className="text-paper/35">{item.timestamp}</span> - <span className="text-paper/80 font-bold">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-navy-border bg-navy flex justify-end gap-2">
              <button
                onClick={() => handlePdfDownload(selectedIncident.id)}
                className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-1.5 hover:scale-[1.02]"
              >
                <FileDown size={14} /> Download PDF Assessment
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}
