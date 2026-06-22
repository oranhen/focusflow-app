import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ToastProvider'

export default function ResetPasswordPage() {
  const nav = useNavigate()
  const { session } = useAuth()
  const toast = useToast()

  const [recovery, setRecovery] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the magic recovery link is processed.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    // Also: if we landed here with a hash already parsed and the user is signed in,
    // assume recovery context. Cheap heuristic that works in practice.
    if (window.location.hash.includes('type=recovery')) setRecovery(true)
    return () => data.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setError(error.message)
      toast.error(error.message)
      return
    }
    toast.success('Password updated. You are now signed in.')
    nav('/dashboard', { replace: true })
  }

  const inRecoveryFlow = recovery || !!session

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 460, margin: '0 auto' }}>
        <h2>Set a new password</h2>

        {!inRecoveryFlow ? (
          <>
            <p style={{ color: 'var(--muted)' }}>
              This page is reached from the password-reset email we send.
              If you got here by mistake, head back to login.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn primary">Back to login</Link>
              <Link to="/forgot-password" className="btn ghost">Request reset email</Link>
            </div>
          </>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              Choose a new password for your account. You'll be signed in immediately after.
            </p>

            <div className="form-row">
              <label htmlFor="pw">New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="pw"
                  className="form-input"
                  type={show ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4,
                  }}
                >{show ? '🙈' : '👁'}</button>
              </div>
              <span className="form-help">At least 6 characters.</span>
            </div>

            <div className="form-row">
              <label htmlFor="pw2">Confirm new password</label>
              <input
                id="pw2"
                className="form-input"
                type={show ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <div>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
