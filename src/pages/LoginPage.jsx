import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const nav = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    nav(redirectTo, { replace: true })
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <label style={{ marginTop: 8 }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          />

          {error && (
            <div style={{ color: '#b91c1c', marginTop: 10, fontSize: 14 }} role="alert">
              {error}
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="nav-cta" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <Link to="/forgot-password" style={{ color: 'var(--muted)' }}>Forgot?</Link>
          </div>

          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--muted)' }}>
            No account? <Link to="/register">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
