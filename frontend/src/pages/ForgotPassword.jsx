import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send the reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-14">
      <p className="eyebrow mb-3">Account recovery</p>
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Reset your password</h1>

      {sent ? (
        <div className="glass-card p-6 text-center">
          <p className="text-paper/80">
            If an account exists for <span className="text-paper">{email}</span>, a reset link is on
            its way. Check your inbox.
          </p>
          <Link to="/login" className="btn-secondary mt-6 inline-flex">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6">
          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-paper/60">
        Remembered it?{' '}
        <Link to="/login" className="text-scan-cyan hover:underline">
          Back to sign in
        </Link>
      </p>
    </section>
  )
}
