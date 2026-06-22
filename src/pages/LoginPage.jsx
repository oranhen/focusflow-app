import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const nav = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      <div className="card" style={{ maxWidth: 420, margin: '40px auto 0' }}>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>Sign in to continue.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="login-pw">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-pw"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4,
                }}
              >{showPassword ? '🙈' : '👁'}</button>
            </div>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <Link to="/forgot-password" style={{ color: 'var(--muted)', fontSize: 14 }}>Forgot password?</Link>
          </div>

          <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
            No account? <Link to="/register">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
