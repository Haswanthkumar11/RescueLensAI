import { useEffect, useMemo, useState } from 'react'
import {
  Shield, Users, Activity, Settings, RefreshCw, Trash2,
  CheckCircle, ShieldAlert, ShieldCheck, Mail, Calendar,
  ArrowUpRight, AlertOctagon, Heart, Sliders, Database, Cpu
} from 'lucide-react'
import { fetchUsers, updateUserRole, fetchHistory, deleteIncident } from '../services/api'
import { formatDate } from '../utils/priority'
import StatCard from '../components/StatCard'

export default function AdminDashboard({ defaultTab = 'users' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [users, setUsers] = useState([])
  const [incidents, setIncidents] = useState([])
  
  const [usersLoading, setUsersLoading] = useState(false)
  const [incidentsLoading, setIncidentsLoading] = useState(false)
  
  const [usersError, setUsersError] = useState(null)
  const [incidentsError, setIncidentsError] = useState(null)

  // Settings mock state for settings tab
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash')
  const [apiTimeout, setApiTimeout] = useState('30')
  const [enableLlmLogging, setEnableLlmLogging] = useState(true)
  const [enableBackupTrigger, setEnableBackupTrigger] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  const loadUsers = () => {
    setUsersLoading(true)
    setUsersError(null)
    fetchUsers()
      .then(setUsers)
      .catch((err) => {
        setUsersError('Failed to fetch user profiles. Make sure schema_info is available.')
        console.error(err)
      })
      .finally(() => setUsersLoading(false))
  }

  const loadIncidents = () => {
    setIncidentsLoading(true)
    setIncidentsError(null)
    fetchHistory(100)
      .then(setIncidents)
      .catch((err) => {
        setIncidentsError('Failed to fetch incident reports.')
        console.error(err)
      })
      .finally(() => setIncidentsLoading(false))
  }

  useEffect(() => {
    loadUsers()
    loadIncidents()
  }, [])

  // Sync active tab with prop updates
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  // Handle user promotion/demotion
  const handleRoleChange = async (userId, newRole) => {
    const originalUsers = users
    // Optimistic UI update
    setUsers((cur) =>
      cur.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    try {
      await updateUserRole(userId, newRole)
    } catch (err) {
      setUsers(originalUsers)
      alert('Could not update role. Verify you are authorized.')
    }
  }

  // Handle incident deletion
  const handleDeleteIncident = async (id) => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to permanently delete this incident? This action is irreversible.')) {
      return
    }
    const originalIncidents = incidents
    setIncidents((cur) => cur.filter((i) => i.id !== id))
    try {
      await deleteIncident(id)
    } catch (err) {
      setIncidents(originalIncidents)
      alert('Failed to delete incident report.')
    }
  }

  const handleSaveSettings = (e) => {
    e.preventDefault()
    setSettingsSuccess(true)
    setTimeout(() => setSettingsSuccess(false), 3000)
  }

  // EOC Global KPIs Calculations
  const stats = useMemo(() => {
    const totalUsers = users.length
    const totalIncidents = incidents.length
    const admins = users.filter((u) => u.role === 'admin').length
    const responders = users.filter((u) => u.role === 'responder').length
    const criticalIncidents = incidents.filter((i) => i.priority === 'Critical').length
    
    return { totalUsers, totalIncidents, admins, responders, criticalIncidents }
  }, [users, incidents])

  return (
    <section className="relative min-h-[90vh] bg-navy text-paper px-6 py-8">
      {/* Grid Pattern mask */}
      <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)] opacity-20 pointer-events-none" />

      {/* Title */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-scan-cyan animate-pulse" />
            <p className="eyebrow !text-scan-cyan font-semibold">HQ Operational Controls</p>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">System Administration</h1>
        </div>

        {/* Global Stats quick info */}
        <div className="flex items-center gap-4 font-mono text-[11px] text-paper/40 bg-navy-light/20 px-4 py-2 rounded-xl border border-navy-border">
          <div>DB Nodes: <span className="text-green-500 font-bold">1 Active</span></div>
          <div>RLS Engine: <span className="text-scan-cyan font-bold">Enforced</span></div>
        </div>
      </div>

      {/* Global KPIs cards */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Global Users" value={usersLoading ? '...' : stats.totalUsers} />
        <StatCard label="Active Responders" value={usersLoading ? '...' : stats.responders} />
        <StatCard label="Total Reports" value={incidentsLoading ? '...' : stats.totalIncidents} />
        <StatCard label="Critical Cases" value={incidentsLoading ? '...' : stats.criticalIncidents} accent="text-alert-red" />
        
        {/* System Health Status card */}
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-1 text-green-500">
            <Activity size={16} />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Live</span>
          </div>
          <p className="text-2xl font-bold font-mono">100%</p>
          <p className="text-[11px] text-paper/40 mt-1 uppercase font-mono tracking-wide">Sys Health</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="relative z-10 grid lg:grid-cols-4 gap-6">
        
        {/* Tab Sidebar Selector */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition font-display text-sm font-semibold border ${
              activeTab === 'users'
                ? 'bg-navy-light border-scan-cyan/30 text-scan-cyan'
                : 'border-transparent text-paper/60 hover:bg-navy-light/45 hover:text-paper'
            }`}
          >
            <Users size={16} />
            User & Role Management
          </button>
          
          <button
            onClick={() => setActiveTab('incidents')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition font-display text-sm font-semibold border ${
              activeTab === 'incidents'
                ? 'bg-navy-light border-scan-cyan/30 text-scan-cyan'
                : 'border-transparent text-paper/60 hover:bg-navy-light/45 hover:text-paper'
            }`}
          >
            <ShieldAlert size={16} />
            Incident Records
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition font-display text-sm font-semibold border ${
              activeTab === 'settings'
                ? 'bg-navy-light border-scan-cyan/30 text-scan-cyan'
                : 'border-transparent text-paper/60 hover:bg-navy-light/45 hover:text-paper'
            }`}
          >
            <Settings size={16} />
            System Settings
          </button>
        </div>

        {/* Tab Content Block */}
        <div className="lg:col-span-3">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="glass-card">
              <div className="px-5 py-4 border-b border-navy-border flex justify-between items-center bg-navy-light/20">
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-scan-cyan">System User Register</h2>
                <button onClick={loadUsers} className="h-7 w-7 rounded bg-navy-border flex items-center justify-center hover:bg-navy-light text-paper/60">
                  <RefreshCw size={12} className={usersLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {usersError && (
                <div className="m-4 p-4 bg-alert-red/10 border border-alert-red/20 rounded-xl text-alert-red text-xs">
                  {usersError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-navy-border bg-navy text-paper/40 uppercase font-mono tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Current Role</th>
                      <th className="py-3 px-4">Last Login</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-border bg-navy-light/10">
                    {usersLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-32 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-5 w-16 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-navy-border rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-paper/30 font-mono">
                          No users registered on the platform.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        return (
                          <tr key={user.id} className="hover:bg-navy-light/35 transition">
                            <td className="py-3 px-4 font-semibold text-paper/85 font-mono text-[11px]">
                              {user.full_name || '—'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-paper/70 font-mono text-[11px]">
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border ${
                                user.role === 'admin'
                                  ? 'bg-alert-red/10 text-alert-red border-alert-red/20'
                                  : user.role === 'responder'
                                  ? 'bg-scan-cyan/15 text-scan-cyan border-scan-cyan/30'
                                  : 'bg-paper/10 text-paper border-paper/20'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-paper/50 font-mono text-[11px]">
                              {user.last_login ? formatDate(user.last_login) : '—'}
                            </td>
                            <td className="py-3 px-4 text-paper/50 font-mono text-[11px]">
                              {user.created_at ? formatDate(user.created_at) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="rounded-lg border border-navy-border bg-navy text-[11px] px-2 py-1 text-paper outline-none focus:border-scan-cyan/40"
                              >
                                <option value="viewer">Viewer</option>
                                <option value="responder">Responder</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INCIDENTS TAB */}
          {activeTab === 'incidents' && (
            <div className="glass-card">
              <div className="px-5 py-4 border-b border-navy-border flex justify-between items-center bg-navy-light/20">
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-scan-cyan">Incident Inventory</h2>
                <button onClick={loadIncidents} className="h-7 w-7 rounded bg-navy-border flex items-center justify-center hover:bg-navy-light text-paper/60">
                  <RefreshCw size={12} className={incidentsLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {incidentsError && (
                <div className="m-4 p-4 bg-alert-red/10 border border-alert-red/20 rounded-xl text-alert-red text-xs">
                  {incidentsError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-navy-border bg-navy text-paper/40 uppercase font-mono tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-4">Case Profile</th>
                      <th className="py-3 px-4">Incident Type</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Response Team</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-border bg-navy-light/10">
                    {incidentsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 px-4"><div className="h-4 w-32 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-20 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-4 w-24 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4"><div className="h-5 w-16 bg-navy-border rounded" /></td>
                          <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-navy-border rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : incidents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-paper/30 font-mono">
                          No incidents logged in database register.
                        </td>
                      </tr>
                    ) : (
                      incidents.map((inc) => (
                        <tr key={inc.id} className="hover:bg-navy-light/35 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={inc.image_url}
                                alt="Report"
                                className="h-8 w-12 object-cover rounded border border-navy-border"
                              />
                              <div>
                                <p className="font-semibold text-paper/85 font-mono text-[11px]">
                                  {inc.id.substring(0, 8)}...
                                </p>
                                <p className="text-[9px] font-mono text-paper/30">
                                  {formatDate(inc.created_at)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-paper/70">
                            {inc.incident_type.replace('_', ' ').toUpperCase()}
                          </td>
                          <td className="py-3 px-4 font-mono uppercase text-paper/50 text-[10px]">
                            {inc.severity}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-paper/50">
                            {inc.priority} ({inc.score})
                          </td>
                          <td className="py-3 px-4 text-paper/50 font-mono text-[11px]">
                            {inc.response_team}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteIncident(inc.id)}
                              className="h-8 w-8 rounded-lg bg-alert-red/10 border border-alert-red/25 hover:bg-alert-red/20 text-alert-red flex items-center justify-center ml-auto transition"
                              title="Delete Incident"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="glass-card p-6">
              <h2 className="font-display font-bold text-sm tracking-wide uppercase text-scan-cyan border-b border-navy-border pb-3 mb-6">
                System Configurations & Variables
              </h2>

              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                
                <div>
                  <label className="form-label mb-2">Gemini Models Routing</label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full rounded-xl border border-navy-border bg-navy px-4 py-2.5 text-xs text-paper focus:border-scan-cyan/40 outline-none"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                  <span className="text-[10px] text-paper/30 mt-1 block">Default model routed for file analyses uploads.</span>
                </div>

                <div>
                  <label className="form-label mb-2">Supabase API Timeout (Seconds)</label>
                  <input
                    type="number"
                    value={apiTimeout}
                    onChange={(e) => setApiTimeout(e.target.value)}
                    className="w-full rounded-xl border border-navy-border bg-navy px-4 py-2.5 text-xs text-paper focus:border-scan-cyan/40 outline-none"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableLlmLogging}
                      onChange={(e) => setEnableLlmLogging(e.target.checked)}
                      className="rounded bg-navy border-navy-border text-scan-cyan"
                    />
                    <div>
                      <span className="text-xs font-semibold text-paper/85">Enable LLM Debug Log Streams</span>
                      <span className="text-[10px] text-paper/30 block">Saves raw AI JSON outputs inside server stdout files.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableBackupTrigger}
                      onChange={(e) => setEnableBackupTrigger(e.target.checked)}
                      className="rounded bg-navy border-navy-border text-scan-cyan"
                    />
                    <div>
                      <span className="text-xs font-semibold text-paper/85">Automatic Daily DB Backup</span>
                      <span className="text-[10px] text-paper/30 block">Launches backup cron job pipelines daily.</span>
                    </div>
                  </label>
                </div>

                {settingsSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle size={14} /> Settings applied successfully to server runtime constants.
                  </div>
                )}

                <div className="pt-4">
                  <button type="submit" className="btn-primary w-fit">
                    Apply Variables
                  </button>
                </div>

              </form>

              {/* System health audit metrics logs */}
              <div className="border-t border-navy-border mt-8 pt-6">
                <h3 className="font-display font-semibold text-xs text-paper/60 uppercase mb-3">Live System Metrics</h3>
                
                <div className="grid sm:grid-cols-3 gap-4 font-mono text-[10px]">
                  <div className="p-3 rounded-xl bg-navy/35 border border-navy-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-paper/50">
                      <Cpu size={12} /> CPU Core Loads
                    </div>
                    <span className="text-scan-cyan font-bold">14%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-navy/35 border border-navy-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-paper/50">
                      <Database size={12} /> DB Response
                    </div>
                    <span className="text-scan-cyan font-bold">42ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-navy/35 border border-navy-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-paper/50">
                      <Sliders size={12} /> Postgrest API
                    </div>
                    <span className="text-green-500 font-bold">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  )
}
