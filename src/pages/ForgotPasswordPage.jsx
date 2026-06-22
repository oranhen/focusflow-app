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
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h2>Reset password</h2>
        <p style={{ color: 'var(--muted)' }}>Enter your email to receive reset instructions.</p>

        <form onSubmit={handleSubmit}>
          <input
            required
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
          />

          {error && (
            <div style={{ color: '#b91c1c', marginTop: 10, fontSize: 14 }} role="alert">
              {error}
            </div>
          )}
          {sent && (
            <div style={{ color: '#065f46', marginTop: 10, fontSize: 14 }} role="status">
              If an account exists for {email}, a reset link has been sent.
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button className="nav-cta" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send reset link'}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--muted)' }}>
            <Link to="/login">Back to sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
