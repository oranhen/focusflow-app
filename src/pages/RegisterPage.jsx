import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const nav = useNavigate()
  const { signUp } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [info, setInfo] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const { data, error } = await signUp({ email, password, fullName })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (!data.session) {
      setInfo('Account created. Check your inbox to confirm your email, then log in.')
      return
    }

    nav('/onboarding', { replace: true })
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 480, margin: '40px auto 0' }}>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>Free forever for one active goal.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              className="form-input"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-input"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="reg-pw">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-pw"
                className="form-input"
                required
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                autoComplete="new-password"
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
            <span className="form-help">At least 6 characters.</span>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          {info && <div className="form-success" role="status">{info}</div>}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>

          <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
