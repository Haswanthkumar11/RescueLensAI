import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { hasPermission } from '../constants/permissions'

export default function ProtectedRoute({ children, roles, permission }) {
  const { isAuthenticated, loading, role, profile, profileError } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) {
    return <p className="mx-auto max-w-2xl px-6 py-20 text-center text-paper/60">Loading…</p>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Signed in, but the backend couldn't load a profile -- almost always
  // a setup problem (e.g. the user_profiles migration hasn't been run),
  // not a "you're not allowed here" situation. Show it plainly instead
  // of silently bouncing to "/", which just looks like a broken button.
  if (!profile && profileError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="mb-2 font-display text-lg font-semibold text-alert-red">Account setup incomplete</p>
        <p className="text-paper/70">{profileError}</p>
        <p className="mt-4 text-sm text-paper/40">
          If you're the developer: check that <code>docs/migrations/002_add_user_profiles.sql</code> has
          been run in Supabase, and that the backend server is running.
        </p>
      </div>
    )
  }

  const isAuthorized = permission 
    ? hasPermission(role, permission)
    : (!roles || roles.includes(role))

  if (!isAuthorized) {
    const requiredDisplay = permission ? `Permission: ${permission}` : `Roles: ${roles.join(', ')}`
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="glass-card max-w-md p-8 flex flex-col items-center">
          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-alert-red/10 text-alert-red ring-4 ring-alert-red/5">
            <ShieldAlert size={28} />
          </span>
          <p className="eyebrow mb-2 text-alert-red">403 Forbidden</p>
          <h1 className="mb-3 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6 text-sm leading-relaxed text-paper/60">
            You do not have the required permissions to view this page. This area is restricted based on access control policies.
          </p>
          
          <div className="mb-8 w-full rounded-xl border border-navy-border bg-navy/40 p-4 text-left font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-paper/40">CURRENT ROLE:</span>
              <span className="text-scan-cyan font-bold uppercase">{role || 'none'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-paper/40">REQUIRED ACCESS:</span>
              <span className="text-alert-amber font-bold uppercase">{requiredDisplay}</span>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1 text-sm py-2.5 px-4"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <Link
              to="/"
              className="btn-primary flex-1 text-sm py-2.5 px-4"
            >
              <Home size={16} /> Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return children
}
