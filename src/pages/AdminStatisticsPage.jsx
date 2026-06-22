import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { fetchAdminStats } from '../lib/api'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import useDocumentTitle from '../hooks/useDocumentTitle'

const DAYS = 14

export default function AdminStatisticsPage() {
  useDocumentTitle('Admin · Statistics')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const s = await fetchAdminStats()
      setStats(s)
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const series = useMemo(() => {
    if (!stats) return []
    const days = Array.from({ length: DAYS }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (DAYS - 1 - i))
      return { date: d.toISOString().slice(0, 10), completed: 0, total: 0, ai: 0 }
    })
    for (const t of stats.recent) {
      const slot = days.find((s) => s.date === t.due_date)
      if (!slot) continue
      slot.total += 1
      if (t.is_completed) slot.completed += 1
      if (t.ai_generated) slot.ai += 1
    }
    return days
  }, [stats])

  const max = Math.max(1, ...series.map((d) => d.total))
  const c = stats?.counts || {}

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Admin — Statistics</h1>
          <div className="subtitle">System-wide health, refreshed on load.</div>
        </div>
        <button className="btn ghost" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
      {loading || !stats ? (
        <Spinner />
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
            <div className="stat-tile"><span className="stat-label">Users</span><span className="stat-value">{c.users}</span></div>
            <div className="stat-tile"><span className="stat-label">Goals</span><span className="stat-value">{c.goals}</span><span className="stat-sub">{c.activeGoals} active</span></div>
            <div className="stat-tile"><span className="stat-label">Tasks</span><span className="stat-value">{c.tasks}</span><span className="stat-sub">{c.completedTasks} completed</span></div>
            <div className="stat-tile">
              <span className="stat-label">Completion rate</span>
              <span className="stat-value">{c.tasks ? Math.round((c.completedTasks / c.tasks) * 100) : 0}%</span>
            </div>
            <div className="stat-tile"><span className="stat-label">Forum posts</span><span className="stat-value">{c.posts}</span></div>
          </section>

          <section className="card rounded-xl">
            <h3 style={{ marginTop: 0 }}>System-wide tasks per day (last {DAYS} days)</h3>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, height: 220, padding: '8px 0' }}>
              {series.map((d) => {
                const completedH = d.total > 0 ? (d.completed / max) * 100 : 0
                const otherH = d.total > 0 ? ((d.total - d.completed) / max) * 100 : 0
                const day = new Date(d.date).getDate()
                const empty = d.total === 0
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 18 }}
                    title={`${d.date}: ${d.completed}/${d.total} done (${d.ai} AI)`}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', width: '100%', position: 'relative' }}>
                      {empty ? (
                        <div style={{ position: 'absolute', inset: 0, borderBottom: '1px dashed var(--border)' }} />
                      ) : (
                        <>
                          <div style={{ height: `${completedH}%`, background: 'var(--primary)', borderRadius: '6px 6px 0 0', minHeight: completedH > 0 ? 3 : 0 }} />
                          <div style={{ height: `${otherH}%`, background: 'rgba(107,70,193,0.18)', borderRadius: completedH === 0 ? '6px 6px 0 0' : '0', minHeight: otherH > 0 ? 3 : 0 }} />
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>{day}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }} />Completed</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(107,70,193,0.12)', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }} />Created but not completed</span>
            </div>
          </section>
        </>
      )}
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
