import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from '../lib/api'
import Spinner from '../components/Spinner'

const FOCUS_OPTIONS = ['career', 'study', 'health', 'personal', 'other']
const MOTIVATION_OPTIONS = ['low', 'medium', 'high']

export default function ProfilePage() {
  const { user, profile, refreshProfile, loading } = useAuth()

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedAt, setSavedAt] = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        main_focus_area: profile.main_focus_area || 'career',
        motivation_level: profile.motivation_level || 'medium',
        preferred_task_time: profile.preferred_task_time || '09:00',
      })
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    if (!user || !form) return
    setSaving(true)
    setError(null)

    const { error } = await updateProfile(user.id, {
      full_name: form.full_name.trim() || null,
      main_focus_area: form.main_focus_area,
      motivation_level: form.motivation_level,
      preferred_task_time: form.preferred_task_time,
    })

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    await refreshProfile()
    setSavedAt(new Date().toLocaleTimeString())
  }

  if (loading || !form) {
    return <div className="container"><Spinner /></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Your profile</h1>
          <div className="subtitle">How FocusFlow personalizes recommendations for you.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, maxWidth: 720 }}>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <span className="label">Email</span>
            <div>{user.email}</div>
          </div>
          <div className="form-row">
            <span className="label">Role</span>
            <div><span className="badge">{profile?.role || 'user'}</span></div>
          </div>
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Personal details</h3>
          <form className="form-grid" onSubmit={handleSave}>
            <div className="form-row">
              <label htmlFor="p-name">Full name</label>
              <input
                id="p-name"
                className="form-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-row">
                <label htmlFor="p-focus">Main focus area</label>
                <select
                  id="p-focus"
                  className="form-select"
                  value={form.main_focus_area}
                  onChange={(e) => setForm({ ...form, main_focus_area: e.target.value })}
                >
                  {FOCUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="p-motiv">Motivation level</label>
                <select
                  id="p-motiv"
                  className="form-select"
                  value={form.motivation_level}
                  onChange={(e) => setForm({ ...form, motivation_level: e.target.value })}
                >
                  {MOTIVATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="p-time">Preferred focus time</label>
              <input
                id="p-time"
                type="time"
                className="form-input"
                value={form.preferred_task_time}
                onChange={(e) => setForm({ ...form, preferred_task_time: e.target.value })}
              />
              <span className="form-help">When you usually want your daily focus block.</span>
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}
            {savedAt && !error && <div className="form-success" role="status">Saved at {savedAt}</div>}

            <div>
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
