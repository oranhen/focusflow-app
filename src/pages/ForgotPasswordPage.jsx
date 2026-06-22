import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSent(false)
    setSending(true)
    const { error } = await resetPassword(email)
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '40px auto 0' }}>
        <h2 style={{ marginTop: 0 }}>Reset your password</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          Enter your email and we'll send a link to set a new password.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              className="form-input"
              required
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          {sent && (
            <div className="form-success" role="status">
              If an account exists for {email}, a reset link has been sent.
            </div>
          )}

          <button className="btn primary" type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send reset link'}
          </button>

          <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
            <Link to="/login">← Back to sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
