import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
      await signUp(email, password, fullName)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not create your account.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-14 text-center">
        <div className="glass-card p-8">
          <p className="eyebrow mb-3">Almost there</p>
          <h1 className="mb-3 text-2xl font-bold">Check your email</h1>
          <p className="text-paper/70">
            We sent a verification link to <span className="text-paper">{email}</span>. Confirm your
            email, then sign in — new accounts start as <span className="text-scan-cyan">Viewer</span> and
            can be upgraded by an administrator.
          </p>
          <Link to="/login" className="btn-secondary mt-6 inline-flex">Back to sign in</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-14">
      <p className="eyebrow mb-3">Get started</p>
      <h1 className="mb-8 text-3xl font-bold sm:text-4xl">Create an account</h1>

      <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6">
        <div>
          <label htmlFor="fullName" className="form-label">Full name</label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
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
          {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-paper/60">
        Already have an account?{' '}
        <Link to="/login" className="text-scan-cyan hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  )
}
