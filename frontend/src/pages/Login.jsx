import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password, remember)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-14">
      <p className="eyebrow mb-3">Welcome back</p>
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Sign in</h1>

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
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-paper/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-navy-border bg-navy-light accent-scan-cyan"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-scan-cyan hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="rounded-lg border border-alert-red/40 bg-alert-red/10 px-3 py-2 text-sm text-alert-red">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-paper/60">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-scan-cyan hover:underline">
          Register
        </Link>
      </p>
    </section>
  )
}
