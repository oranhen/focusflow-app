import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const nav = useNavigate()
  const { signUp } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    // If "Confirm email" is enabled on Supabase, session will be null until verified.
    if (!data.session) {
      setInfo('Account created. Check your inbox to confirm your email, then log in.')
      return
    }

    nav('/onboarding', { replace: true })
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2>Create account</h2>
        <p style={{ color: 'var(--muted)' }}>Sign up and start your free trial.</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginTop: 8 }}>Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'block', marginTop: 8 }}>Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'block', marginTop: 8 }}>Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          />

          {error && (
            <div style={{ color: '#b91c1c', marginTop: 10, fontSize: 14 }} role="alert">
              {error}
            </div>
          )}
          {info && (
            <div style={{ color: '#065f46', marginTop: 10, fontSize: 14 }} role="status">
              {info}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button className="nav-cta" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--muted)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
