import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { listActivePlans, fetchCurrentSubscription, chooseSubscriptionPlan } from '../lib/api'
import Spinner from '../components/Spinner'
import { useToast } from '../components/ToastProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function PricingPage() {
  useDocumentTitle('Pricing')
  const nav = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [plans, setPlans] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [switchingTo, setSwitchingTo] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [{ data: p, error: pErr }, sub] = await Promise.all([
      listActivePlans(),
      user ? fetchCurrentSubscription(user.id) : Promise.resolve({ data: null }),
    ])
    if (pErr) setError(pErr.message)
    setPlans(p || [])
    setCurrent(sub?.data || null)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function handleChoose(plan) {
    if (!user) {
      nav('/register')
      return
    }
    setSwitchingTo(plan.id)
    const { error } = await chooseSubscriptionPlan(user.id, plan.id)
    setSwitchingTo(null)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`You're now on the ${plan.name} plan.`)
    await load()
  }

  const currentPlanId = current?.subscription_plan_id

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Pricing</h1>
          <div className="subtitle">Simple plans for individuals. Switch any time.</div>
        </div>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <Spinner />
      ) : plans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>No plans available yet.</div>
      ) : (
        <div className="pricing-cards">
          {plans.map((plan, i) => {
            const isCurrent = currentPlanId === plan.id
            const isRecommended = plans.length === 3 ? i === 1 : false
            return (
              <article
                key={plan.id}
                className={`pricing-card card ${isRecommended ? 'recommended' : ''}`}
              >
                <h3 style={{ margin: 0 }}>{plan.name}</h3>
                <div className="price">
                  {Number(plan.price) === 0 ? 'Free' : `$${Number(plan.price).toFixed(2)}`}
                  {Number(plan.price) > 0 && <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}> / mo</span>}
                </div>
                {plan.description && (
                  <p style={{ color: 'var(--muted)', fontSize: 14, minHeight: 40 }}>{plan.description}</p>
                )}
                <ul style={{ marginTop: 10, textAlign: 'left' }}>
                  {(plan.features || '').split('\n').filter(Boolean).map((f, idx) => (
                    <li key={idx} style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--tertiary)' }}>✓</span>
                      <span style={{ color: 'var(--muted)' }}>{f.replace(/^[-•]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="plan-current-tag">Your current plan</div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn primary"
                      disabled={switchingTo === plan.id}
                      onClick={() => handleChoose(plan)}
                    >
                      {switchingTo === plan.id ? 'Switching…' : user ? `Switch to ${plan.name}` : `Get ${plan.name}`}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
