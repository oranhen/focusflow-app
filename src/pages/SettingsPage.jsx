import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { clearChatHistory } from '../lib/api'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function SettingsPage() {
  useDocumentTitle('Settings')
  const nav = useNavigate()
  const { user, profile, resetPassword, signOut } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [resetting, setResetting] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handlePasswordReset() {
    if (!user?.email) return
    setResetting(true)
    const { error } = await resetPassword(user.email)
    setResetting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`Reset link sent to ${user.email}.`)
  }

  async function handleClearChat() {
    if (!user) return
    const ok = await confirm({
      title: 'Clear chat history?',
      message: 'All messages between you and the FocusFlow AI will be removed. This cannot be undone.',
      confirmLabel: 'Clear history',
      danger: true,
    })
    if (!ok) return
    setClearing(true)
    const { error } = await clearChatHistory(user.id)
    setClearing(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Chat history deleted.')
  }

  async function handleSignOut() {
    await signOut()
    nav('/', { replace: true })
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <div className="subtitle">Account, security, and data controls.</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <main>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, maxWidth: 720 }}>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <span className="label">Email</span>
            <div>{user?.email}</div>
          </div>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <span className="label">Role</span>
            <div><span className="badge">{profile?.role || 'user'}</span></div>
          </div>
          <div className="form-row">
            <span className="label">Personal details</span>
            <div><Link to="/profile">Edit on your profile page →</Link></div>
          </div>
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Security</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            We'll email you a link to set a new password.
          </p>
          <button className="btn ghost" onClick={handlePasswordReset} disabled={resetting}>
            {resetting ? 'Sending…' : 'Send password reset email'}
          </button>
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Your data</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <button className="btn subtle" onClick={handleClearChat} disabled={clearing}>
                {clearing ? 'Clearing…' : 'Clear chat history'}
              </button>
              <span className="form-help" style={{ marginLeft: 10 }}>Removes all messages between you and the FocusFlow AI.</span>
            </div>
          </div>
        </section>

        <section className="card" style={{ borderColor: 'rgba(185,28,28,0.2)' }}>
          <h3 style={{ marginTop: 0, color: '#b91c1c' }}>Danger zone</h3>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            Sign out of this device, or contact support to delete your account permanently.
          </p>
          <button className="btn danger" onClick={handleSignOut}>Sign out</button>
        </section>
      </div>
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
