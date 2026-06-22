import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from '../lib/api'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/ToastProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

const FOCUS_OPTIONS = ['career', 'study', 'health', 'personal', 'other']
const MOTIVATION_OPTIONS = ['low', 'medium', 'high']
const TIME_COMMITMENT_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: '15min', label: '15 minutes / day' },
  { value: '30min', label: '30 minutes / day' },
  { value: '1h', label: '1 hour / day' },
  { value: '2h+', label: '2+ hours / day' },
]
const ENERGY_PEAK_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'variable', label: 'Variable' },
]
const EXPERIENCE_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'beginner', label: 'Just starting out' },
  { value: 'some', label: 'Some experience' },
  { value: 'experienced', label: 'Experienced' },
]

export default function ProfilePage() {
  useDocumentTitle('Profile')
  const { user, profile, refreshProfile, loading } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        main_focus_area: profile.main_focus_area || 'career',
        motivation_level: profile.motivation_level || 'medium',
        preferred_task_time: profile.preferred_task_time || '09:00',
        daily_time_commitment: profile.daily_time_commitment || '',
        energy_peak: profile.energy_peak || '',
        experience_level: profile.experience_level || '',
        biggest_blocker: profile.biggest_blocker || '',
        success_definition: profile.success_definition || '',
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
      daily_time_commitment: form.daily_time_commitment || null,
      energy_peak: form.energy_peak || null,
      experience_level: form.experience_level || null,
      biggest_blocker: form.biggest_blocker.trim() || null,
      success_definition: form.success_definition.trim() || null,
    })

    setSaving(false)
    if (error) {
      setError(error.message)
      toast.error(error.message)
      return
    }
    await refreshProfile()
    toast.success('Profile saved.')
  }

  if (loading || !form) {
    return <div className="container"><Spinner /></div>
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Your profile</h1>
          <div className="subtitle">The signals FocusFlow uses to personalize your daily plan.</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <main>
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
                    <label htmlFor="p-exp">Level with your goal</label>
                    <select
                      id="p-exp"
                      className="form-select"
                      value={form.experience_level}
                      onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
                    >
                      {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

                  <div className="form-row">
                    <label htmlFor="p-commit">Daily time commitment</label>
                    <select
                      id="p-commit"
                      className="form-select"
                      value={form.daily_time_commitment}
                      onChange={(e) => setForm({ ...form, daily_time_commitment: e.target.value })}
                    >
                      {TIME_COMMITMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-row">
                    <label htmlFor="p-time">Preferred focus time</label>
                    <input
                      id="p-time"
                      type="time"
                      className="form-input"
                      value={form.preferred_task_time}
                      onChange={(e) => setForm({ ...form, preferred_task_time: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="p-energy">Energy peak</label>
                    <select
                      id="p-energy"
                      className="form-select"
                      value={form.energy_peak}
                      onChange={(e) => setForm({ ...form, energy_peak: e.target.value })}
                    >
                      {ENERGY_PEAK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="p-blocker">What usually gets in the way?</label>
                  <textarea
                    id="p-blocker"
                    className="form-textarea"
                    rows={2}
                    value={form.biggest_blocker}
                    onChange={(e) => setForm({ ...form, biggest_blocker: e.target.value })}
                  />
                  <span className="form-help">The AI uses this to frame your daily tasks.</span>
                </div>

                <div className="form-row">
                  <label htmlFor="p-success">What does success look like in 3 months?</label>
                  <textarea
                    id="p-success"
                    className="form-textarea"
                    rows={2}
                    value={form.success_definition}
                    onChange={(e) => setForm({ ...form, success_definition: e.target.value })}
                  />
                </div>

                {error && <div className="form-error" role="alert">{error}</div>}

                <div>
                  <button className="btn primary" type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
