import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listRecentTasks, listGoals } from '../lib/api'
import Sidebar from '../components/Sidebar'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import useDocumentTitle from '../hooks/useDocumentTitle'

const DAYS = 14

export default function ProgressPage() {
  useDocumentTitle('Progress')
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: t, error: tErr }, { data: g }] = await Promise.all([
      listRecentTasks(user.id, 200),
      listGoals(user.id),
    ])
    if (tErr) setError(tErr.message)
    setTasks(t || [])
    setGoals(g || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const series = useMemo(() => {
    const days = Array.from({ length: DAYS }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (DAYS - 1 - i))
      return { date: d.toISOString().slice(0, 10), completed: 0, total: 0, ai: 0 }
    })
    for (const t of tasks) {
      const slot = days.find((s) => s.date === t.due_date)
      if (!slot) continue
      slot.total += 1
      if (t.is_completed) slot.completed += 1
      if (t.ai_generated) slot.ai += 1
    }
    return days
  }, [tasks])

  const totals = useMemo(() => {
    const completed = series.reduce((s, d) => s + d.completed, 0)
    const total = series.reduce((s, d) => s + d.total, 0)
    const ai = series.reduce((s, d) => s + d.ai, 0)
    const goalsActive = goals.filter((g) => g.status === 'active').length
    const goalsDone = goals.filter((g) => g.status === 'completed').length
    return {
      completed,
      total,
      pct: total ? Math.round((completed / total) * 100) : 0,
      ai,
      goalsActive,
      goalsDone,
    }
  }, [series, goals])

  const insights = useMemo(() => {
    const out = []
    const recentDays = series.slice(-7)
    const weekdayPerf = { weekday: { c: 0, t: 0 }, weekend: { c: 0, t: 0 } }
    for (const d of recentDays) {
      const dow = new Date(d.date).getDay()
      const k = dow === 0 || dow === 6 ? 'weekend' : 'weekday'
      weekdayPerf[k].c += d.completed
      weekdayPerf[k].t += d.total
    }
    if (weekdayPerf.weekday.t && weekdayPerf.weekend.t) {
      const wd = weekdayPerf.weekday.c / weekdayPerf.weekday.t
      const we = weekdayPerf.weekend.c / weekdayPerf.weekend.t
      if (wd - we > 0.2) out.push('You finish more tasks on weekdays than weekends — protect a small weekend slot to keep momentum.')
      else if (we - wd > 0.2) out.push('You execute better on weekends. Try carrying that mindset into Monday mornings.')
    }
    if (totals.ai > 0) {
      out.push(`${totals.ai} of your tasks were AI-generated. Lean on the "Generate" button when you feel stuck.`)
    }
    if (totals.pct >= 70 && totals.total >= 5) {
      out.push(`Strong execution rate (${totals.pct}%). Consider raising your motivation level to push harder.`)
    }
    if (totals.total === 0) {
      out.push('No tasks tracked yet in the last 2 weeks. Add a goal and generate today\'s tasks to start.')
    }
    return out
  }, [series, totals])

  const max = Math.max(1, ...series.map((d) => d.total))

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Progress</h1>
          <div className="subtitle">{DAYS}-day view of how you actually move the needle.</div>
        </div>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 18 }}>
            <div className="stat-tile">
              <span className="stat-label">{DAYS}-day rate</span>
              <span className="stat-value">{totals.pct}%</span>
              <span className="stat-sub">{totals.completed}/{totals.total} tasks</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">AI-generated</span>
              <span className="stat-value">{totals.ai}</span>
              <span className="stat-sub">tasks from FocusFlow</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Goals active</span>
              <span className="stat-value">{totals.goalsActive}</span>
              <span className="stat-sub">{totals.goalsDone} completed</span>
            </div>
          </section>

          <section className="card rounded-xl" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Tasks per day (last {DAYS} days)</h3>
            {loading ? (
              <Spinner />
            ) : totals.total === 0 ? (
              <EmptyState
                icon="📈"
                title="No data yet"
                description="As soon as you add and complete tasks, this chart will fill in."
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, height: 200, padding: '8px 0' }}>
                {series.map((d) => {
                  const completedH = d.total > 0 ? (d.completed / max) * 100 : 0
                  const remainingH = d.total > 0 ? ((d.total - d.completed) / max) * 100 : 0
                  const day = new Date(d.date).getDate()
                  const empty = d.total === 0
                  return (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 18 }} title={`${d.date}: ${d.completed}/${d.total}`}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', width: '100%', position: 'relative' }}>
                        {empty ? (
                          <div style={{ position: 'absolute', inset: 0, borderBottom: '1px dashed var(--border)' }} />
                        ) : (
                          <>
                            <div style={{ height: `${completedH}%`, background: 'var(--primary)', borderRadius: '6px 6px 0 0', minHeight: completedH > 0 ? 3 : 0 }} />
                            <div style={{ height: `${remainingH}%`, background: 'rgba(107,70,193,0.18)', borderRadius: completedH === 0 ? '6px 6px 0 0' : '0', minHeight: remainingH > 0 ? 3 : 0 }} />
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>{day}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }} />Completed</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(107,70,193,0.12)', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }} />Created but not done</span>
            </div>
          </section>

          <section className="card">
            <h3 style={{ marginTop: 0 }}>AI insights</h3>
            {insights.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>Keep going — more insights as you build history.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {insights.map((s, i) => (
                  <li key={i} style={{ color: 'var(--muted)', marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <Sidebar />
      </div>
    </div>
  )
}
