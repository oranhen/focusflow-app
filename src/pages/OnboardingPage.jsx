import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ToastProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const FOCUS_OPTIONS = [
  { value: 'career', label: 'Career', icon: '💼', sub: 'Job, promotion, side project' },
  { value: 'study', label: 'Study', icon: '📚', sub: 'Exam, course, new skill' },
  { value: 'health', label: 'Health', icon: '💪', sub: 'Fitness, nutrition, energy' },
  { value: 'personal', label: 'Personal', icon: '🌱', sub: 'Habit, relationship, growth' },
  { value: 'other', label: 'Something else', icon: '✨', sub: 'Tell us in your goal' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Just starting out', icon: '🌱', sub: "I'm new to this" },
  { value: 'some', label: 'Some experience', icon: '🌿', sub: 'I know the basics' },
  { value: 'experienced', label: 'Experienced', icon: '🌳', sub: 'Looking to level up' },
]

const MOTIVATION_OPTIONS = [
  { value: 'low', label: 'Low', icon: '🌙', sub: 'Taking it slow, building up' },
  { value: 'medium', label: 'Medium', icon: '⚖️', sub: 'Steady pace works for me' },
  { value: 'high', label: 'High', icon: '🔥', sub: "I'm ready to push hard" },
]

const TIME_COMMITMENT_OPTIONS = [
  { value: '15min', label: '15 min', icon: '⚡', sub: 'A quick daily nudge' },
  { value: '30min', label: '30 min', icon: '🎯', sub: 'A solid focus block' },
  { value: '1h',    label: '1 hour', icon: '🚀', sub: 'Real momentum each day' },
  { value: '2h+',   label: '2+ hours', icon: '🏔', sub: "Going deep, I'm all in" },
]

const ENERGY_OPTIONS = [
  { value: 'morning',   label: 'Morning',   icon: '🌅', sub: 'I rise sharp' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️', sub: 'I hit my stride mid-day' },
  { value: 'evening',   label: 'Evening',   icon: '🌆', sub: 'Night-owl energy' },
  { value: 'variable',  label: 'It varies', icon: '🔁', sub: 'Different every day' },
]

// ---------------------------------------------------------------------------
// Small reusable building blocks
// ---------------------------------------------------------------------------

function ChoiceGrid({ options, value, onChange, columns }) {
  return (
    <div className="onb-choice-grid" style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`onb-choice ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <div className="onb-choice-icon">{o.icon}</div>}
          <div className="onb-choice-label">{o.label}</div>
          {o.sub && <div className="onb-choice-sub">{o.sub}</div>}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  useDocumentTitle('Welcome')
  const nav = useNavigate()
  const { user, refreshProfile } = useAuth()
  const toast = useToast()

  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [mainGoal, setMainGoal] = useState('')
  const [focus, setFocus] = useState('career')
  const [experienceLevel, setExperienceLevel] = useState('some')
  const [motivation, setMotivation] = useState('medium')
  const [timeCommitment, setTimeCommitment] = useState('30min')
  const [energyPeak, setEnergyPeak] = useState('morning')
  const [preferredTime, setPreferredTime] = useState('09:00')
  const [biggestBlocker, setBiggestBlocker] = useState('')
  const [successDefinition, setSuccessDefinition] = useState('')

  // Each step describes what's rendered + what input it shows.
  // Order matters; total = steps.length
  const steps = [
    {
      icon: '🎯',
      title: 'What goal are you focused on?',
      sub: 'Be specific — one sentence is plenty. We will turn it into daily actions.',
      canSkipForward: () => true,
      content: (
        <div className="form-row" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
          <input
            className="form-input onb-text-input"
            autoFocus
            placeholder="e.g. Land a senior cybersecurity role"
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
          />
        </div>
      ),
    },
    {
      icon: '🧭',
      title: 'Which area does this goal sit in?',
      sub: "Pick the one that fits best. It helps the AI frame today's tasks.",
      content: (
        <ChoiceGrid options={FOCUS_OPTIONS} value={focus} onChange={setFocus} columns={5} />
      ),
    },
    {
      icon: '🌳',
      title: 'How experienced are you with this goal?',
      sub: 'We adjust difficulty and framing accordingly.',
      content: (
        <ChoiceGrid options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={setExperienceLevel} columns={3} />
      ),
    },
    {
      icon: '🔥',
      title: 'How motivated are you right now?',
      sub: 'Be honest. We will pace your tasks accordingly.',
      content: (
        <ChoiceGrid options={MOTIVATION_OPTIONS} value={motivation} onChange={setMotivation} columns={3} />
      ),
    },
    {
      icon: '⏱',
      title: 'How much time can you give this each day?',
      sub: 'Pick what is realistic, not aspirational. Small consistent wins beat heroic sprints.',
      content: (
        <ChoiceGrid options={TIME_COMMITMENT_OPTIONS} value={timeCommitment} onChange={setTimeCommitment} columns={4} />
      ),
    },
    {
      icon: '⚡',
      title: 'When is your energy at its peak?',
      sub: 'We will line up your daily focus block with this.',
      content: (
        <ChoiceGrid options={ENERGY_OPTIONS} value={energyPeak} onChange={setEnergyPeak} columns={4} />
      ),
    },
    {
      icon: '🕘',
      title: 'What time of day works best for your focus block?',
      sub: 'Roughly when you want to do your daily 15-30 minute push.',
      content: (
        <div className="form-row" style={{ maxWidth: 220, margin: '0 auto' }}>
          <input
            type="time"
            className="form-input onb-text-input"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />
        </div>
      ),
    },
    {
      icon: '🚧',
      title: 'What usually gets in the way?',
      sub: 'One sentence. The AI will gently work around it. Skip if not sure.',
      content: (
        <div className="form-row" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
          <textarea
            className="form-textarea onb-text-input"
            rows={3}
            placeholder="e.g. I get overwhelmed when I look at the whole goal at once"
            value={biggestBlocker}
            onChange={(e) => setBiggestBlocker(e.target.value)}
          />
        </div>
      ),
    },
    {
      icon: '🏆',
      title: 'What does success look like in 3 months?',
      sub: 'Your AI coach uses this as a north-star when picking daily tasks.',
      content: (
        <div className="form-row" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'left' }}>
          <textarea
            className="form-textarea onb-text-input"
            rows={3}
            placeholder="e.g. I'm interviewing for senior roles · I can run 5k comfortably · I've shipped my side project"
            value={successDefinition}
            onChange={(e) => setSuccessDefinition(e.target.value)}
          />
        </div>
      ),
    },
  ]

  const totalSteps = steps.length
  const current = steps[stepIndex]
  const isLast = stepIndex === totalSteps - 1
  const isFirst = stepIndex === 0

  async function finish() {
    if (!user) return
    setError(null)
    setSubmitting(true)

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        main_focus_area: focus,
        motivation_level: motivation,
        preferred_task_time: preferredTime,
        daily_time_commitment: timeCommitment || null,
        energy_peak: energyPeak || null,
        experience_level: experienceLevel || null,
        biggest_blocker: biggestBlocker.trim() || null,
        success_definition: successDefinition.trim() || null,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      toast.error(profileError.message)
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
        toast.error(goalError.message)
        setSubmitting(false)
        return
      }
    }

    await refreshProfile()
    setSubmitting(false)
    toast.success('All set! Welcome to FocusFlow.')
    nav('/dashboard', { replace: true })
  }

  function next() {
    if (isLast) finish()
    else setStepIndex(stepIndex + 1)
  }

  function back() {
    if (!isFirst) setStepIndex(stepIndex - 1)
  }

  return (
    <div className="onb-stage">
      <div className="onb-topbar">
        <div className="brand" style={{ fontSize: 18 }}>FocusFlow</div>
        <button type="button" className="onb-skip" onClick={finish} disabled={submitting}>
          Skip for now →
        </button>
      </div>

      <div className="onb-progress-wrap">
        <div className="onb-progress-bar">
          <div className="onb-progress-fill" style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} />
        </div>
        <div className="onb-progress-label">Step {stepIndex + 1} of {totalSteps}</div>
      </div>

      <div key={stepIndex} className="onb-screen">
        <div className="onb-icon">{current.icon}</div>
        <h1 className="onb-title">{current.title}</h1>
        {current.sub && <p className="onb-sub">{current.sub}</p>}

        <div className="onb-content">{current.content}</div>

        {error && <div className="form-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}
      </div>

      <div className="onb-nav">
        <button
          type="button"
          className="btn subtle"
          onClick={back}
          disabled={isFirst || submitting}
          style={{ visibility: isFirst ? 'hidden' : 'visible' }}
        >
          ← Back
        </button>

        <button
          type="button"
          className="btn primary onb-next"
          onClick={next}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : isLast ? 'Finish & go to dashboard →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
