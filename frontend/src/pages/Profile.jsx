import { useState } from 'react'
import { Loader2, LogOut, Save, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { formatDate } from '../utils/priority'

const ROLE_LABELS = { admin: 'Administrator', responder: 'Emergency Responder', viewer: 'Viewer' }

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    organization: profile?.organization || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  if (!profile) return null

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await api.patch('/profile/me', form)
      await refreshProfile()
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-14">
      <p className="eyebrow mb-3">Your account</p>
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Profile</h1>

      <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-paper/50">{profile.email}</p>
          <p className="mt-1 flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck size={18} className="text-scan-cyan" />
            {ROLE_LABELS[profile.role] || profile.role}
          </p>
          {profile.last_login && (
            <p className="mt-1 font-mono text-xs text-paper/40">Last login {formatDate(profile.last_login)}</p>
          )}
        </div>
        <button type="button" onClick={signOut} className="btn-secondary !py-2 !px-4 text-sm">
          <LogOut size={16} /> Log out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6">
        <div>
          <label className="form-label" htmlFor="full_name">Full name</label>
          <input id="full_name" className="input" value={form.full_name} onChange={handleChange('full_name')} />
        </div>
        <div>
          <label className="form-label" htmlFor="phone">Phone</label>
          <input id="phone" className="input" value={form.phone} onChange={handleChange('phone')} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="department">Department</label>
            <input id="department" className="input" value={form.department} onChange={handleChange('department')} />
          </div>
          <div>
            <label className="form-label" htmlFor="organization">Organization</label>
            <input id="organization" className="input" value={form.organization} onChange={handleChange('organization')} />
          </div>
        </div>

        {message && <p className="text-sm text-scan-cyan">{message}</p>}
        {error && (
          <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}
