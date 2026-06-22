import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const FOCUS_OPTIONS = [
  { value: 'career', label: 'Career' },
  { value: 'study', label: 'Study' },
  { value: 'health', label: 'Health' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

const MOTIVATION_OPTIONS = [
  { value: 'low', label: 'Low — taking it slow' },
  { value: 'medium', label: 'Medium — steady pace' },
  { value: 'high', label: 'High — ready to push' },
]

export default function OnboardingPage() {
  const nav = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [mainGoal, setMainGoal] = useState('')
  const [focus, setFocus] = useState('career')
  const [motivation, setMotivation] = useState('medium')
  const [preferredTime, setPreferredTime] = useState('09:00')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSubmitting(true)

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        main_focus_area: focus,
        motivation_level: motivation,
        preferred_task_time: preferredTime,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setSubmitting(false)
      return
    }

    if (mainGoal.trim()) {
      const { error: goalError } = await supabase.from('goals').insert({
        user_id: user.id,
        title: mainGoal.trim(),
        category: focus,
        status: 'active',
      })
      if (goalError) {
        setError(goalError.message)
        setSubmitting(false)
        return
      }
    }

    await refreshProfile()
    setSubmitting(false)
    nav('/dashboard', { replace: true })
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h2>Welcome — Onboarding</h2>
        <p style={{ color: 'var(--muted)' }}>
          Tell us a bit about your goals and we&apos;ll create a first plan.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <label>
            <div style={{ marginBottom: 4 }}>What is your main goal?</div>
            <input
              placeholder="e.g. Land a senior cybersecurity role"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>

          <label>
            <div style={{ marginBottom: 4 }}>Main focus area</div>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            >
              {FOCUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ marginBottom: 4 }}>Motivation level</div>
            <select
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            >
              {MOTIVATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ marginBottom: 4 }}>Preferred time to focus</div>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>

          {error && (
            <div style={{ color: '#b91c1c', fontSize: 14 }} role="alert">{error}</div>
          )}

          <div>
            <button className="nav-cta" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Finish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
