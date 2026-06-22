import React from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureCard from '../components/FeatureCard'

function MockDashboardPreview() {
  return (
    <div className="hero-mock">
      <div className="hero-mock-bar">
        <span /><span /><span />
      </div>
      <div className="hero-mock-body">
        <div className="hero-mock-stat">
          <div className="hero-mock-stat-label">Today</div>
          <div className="hero-mock-stat-value">3 of 3 ✓</div>
        </div>
        <ul className="hero-mock-tasks">
          <li className="done">
            <span className="hero-mock-check">✓</span>
            <span>Read one chapter on identity & access</span>
            <span className="badge sun">✨ AI</span>
          </li>
          <li className="done">
            <span className="hero-mock-check">✓</span>
            <span>Reach out to 1 person in your network</span>
            <span className="badge sun">✨ AI</span>
          </li>
          <li>
            <span className="hero-mock-check" />
            <span>Update LinkedIn project bullet</span>
            <span className="badge sun">✨ AI</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="container">
      <section className="hero card rounded-xl">
        <div className="hero-left">
          <span className="badge">AI-powered productivity</span>
          <h1 style={{ marginTop: 10 }}>
            Turn your big goal into today's <span style={{ color: 'var(--primary)' }}>three actions</span>.
          </h1>
          <p>
            FocusFlow takes the goal you actually care about, looks at how you work,
            and writes today's plan for you — three concrete, 15-minute steps that move you forward.
          </p>
          <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 16, gap: 10 }}>
            <button className="btn primary" onClick={() => nav('/register')}>Start free</button>
            <button className="btn ghost" onClick={() => nav('/login')}>I have an account</button>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
            No credit card. Free plan forever.
          </div>
        </div>
        <div className="hero-right">
          <MockDashboardPreview />
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>How FocusFlow works</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 0 }}>
          The bridge between long-term ambition and what to do <em>today</em>.
        </p>

        <div className="how-grid">
          <div className="how-step">
            <div className="how-step-num">1</div>
            <h4>Tell us a goal</h4>
            <p>"Land a senior cybersecurity role." "Pass the calculus final." Whatever moves you.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">2</div>
            <h4>AI breaks it down</h4>
            <p>One click. Gemini reads your goal + your focus area + motivation level and writes three small actions for today.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">3</div>
            <h4>Just do today's three</h4>
            <p>Each task is 15-25 minutes with a reason ("how this advances your goal"). Tick boxes. Build streak.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">4</div>
            <h4>Compound, daily</h4>
            <p>Streaks, weekly progress, and AI insights show how much you've actually moved — not just planned.</p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ textAlign: 'center' }}>Why FocusFlow</h2>
        <div className="features">
          <FeatureCard title="Concrete, not generic" icon="🎯">
            Every task is tied to one of your real goals — and includes a one-line reason for being on today's list.
          </FeatureCard>
          <FeatureCard title="Built around you" icon="🧠">
            Your motivation level, focus area, and progress shape what the AI suggests. Not advice — a plan.
          </FeatureCard>
          <FeatureCard title="Calm, focused, daily" icon="🌱">
            No infinite backlog. Three actions, today. Tomorrow gets its own plan.
          </FeatureCard>
        </div>
      </section>

      <section className="card rounded-xl" style={{ marginTop: 36, textAlign: 'center', padding: 36 }}>
        <h2 style={{ marginTop: 0 }}>Ready to stop planning and start doing?</h2>
        <p style={{ color: 'var(--muted)' }}>Free forever for one active goal. Upgrade any time.</p>
        <div style={{ display: 'inline-flex', gap: 8, marginTop: 8 }}>
          <button className="btn primary" onClick={() => nav('/register')}>Start free</button>
          <button className="btn ghost" onClick={() => nav('/pricing')}>See plans</button>
        </div>
      </section>
    </div>
  )
}
