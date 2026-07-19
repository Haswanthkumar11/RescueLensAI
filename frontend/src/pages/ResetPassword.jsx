import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Clicking the emailed link lands here with a recovery token in the
    // URL; the Supabase client (detectSessionInUrl: true) exchanges it
    // for a session automatically. We just wait for that to land.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err.message || 'Could not update your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-14">
      <p className="eyebrow mb-3">Account recovery</p>
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Choose a new password</h1>

      {!ready ? (
        <p className="text-paper/60">Verifying your reset link…</p>
      ) : done ? (
        <div className="glass-card p-6 text-center text-paper/80">
          Password updated. Redirecting you to sign in…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6">
          <div>
            <label htmlFor="password" className="form-label">New password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </section>
  )
}
