import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listAllUsers, setUserRole, deleteUserAccount } from '../lib/api'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function AdminUsersPage() {
  useDocumentTitle('Admin · Users')
  const { user: me } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingFor, setSavingFor] = useState(null)
  const [deletingFor, setDeletingFor] = useState(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await listAllUsers()
    if (error) setError(error.message)
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleRole(u) {
    const next = u.role === 'admin' ? 'user' : 'admin'
    if (u.id === me?.id && next !== 'admin') {
      const ok = await confirm({
        title: 'Remove your own admin role?',
        message: 'You will lose access to all admin pages immediately. This cannot be undone except by another admin promoting you back.',
        confirmLabel: 'Demote me',
        danger: true,
      })
      if (!ok) return
    }
    setSavingFor(u.id)
    const { data, error } = await setUserRole(u.id, next)
    setSavingFor(null)
    if (error) {
      toast.error(error.message)
      return
    }
    setUsers((prev) => prev.map((row) => (row.id === u.id ? data : row)))
    toast.success(`${u.full_name || 'User'} is now ${next}.`)
  }

  async function handleDeleteUser(u) {
    if (u.id === me?.id) {
      toast.error('You cannot delete your own account from here.')
      return
    }
    const ok = await confirm({
      title: `Delete ${u.full_name || 'this user'}?`,
      message:
        'This permanently removes the account and ALL of their data — goals, tasks, progress, chat messages, posts, comments. Cannot be undone.',
      confirmLabel: 'Delete account',
      danger: true,
    })
    if (!ok) return
    setDeletingFor(u.id)
    const { error } = await deleteUserAccount(u.id)
    setDeletingFor(null)
    if (error) {
      toast.error(error.message)
      return
    }
    setUsers((prev) => prev.filter((row) => row.id !== u.id))
    toast.success(`${u.full_name || 'User'} deleted.`)
  }

  const filtered = users.filter((u) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin — Users</h1>
          <div className="subtitle">{users.length} total · manage roles and view onboarding state.</div>
        </div>
        <input
          className="form-input"
          placeholder="Search by name, email, or id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="👥" title="No matches" description="Try a different search." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Focus</th>
                <th>Motivation</th>
                <th>Onboarded</th>
                <th>Role</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.full_name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.id.slice(0, 8)}…</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>{u.email || '—'}</td>
                  <td><span className="badge gray">{u.main_focus_area || '—'}</span></td>
                  <td>{u.motivation_level || '—'}</td>
                  <td>{u.onboarding_completed ? '✓' : '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'sun' : ''}`}>{u.role}</span>
                    {u.id === me?.id && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--muted)' }}>(you)</span>}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn small subtle"
                        onClick={() => toggleRole(u)}
                        disabled={savingFor === u.id || deletingFor === u.id}
                      >
                        {savingFor === u.id ? '…' : u.role === 'admin' ? 'Demote' : 'Make admin'}
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => handleDeleteUser(u)}
                        disabled={deletingFor === u.id || u.id === me?.id}
                        title={u.id === me?.id ? 'You cannot delete your own account here' : 'Delete user'}
                      >
                        {deletingFor === u.id ? '…' : '🗑'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
