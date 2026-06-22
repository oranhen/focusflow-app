import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  listGoals,
  listTasksForDate,
  listRecentTasks,
  createTask,
  setTaskCompleted,
  deleteTask,
  generateTasksForGoal,
  todayISO,
} from '../lib/api'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'

const DAILY_TIPS = [
  'Break big goals into 15-minute focused blocks.',
  'Pick the single most important task for today and finish it before anything else.',
  'Consistency beats intensity — show up every day, even briefly.',
  'When you feel stuck, lower the bar: just open the file, write one sentence.',
  'Tomorrow you starts with what you finished today.',
]

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const today = useMemo(() => todayISO(), [])

  const [goals, setGoals] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [adding, setAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskGoalId, setNewTaskGoalId] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingFor, setGeneratingFor] = useState(null) // goalId being generated for

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: g, error: gErr }, { data: t, error: tErr }, { data: r }] = await Promise.all([
      listGoals(user.id),
      listTasksForDate(user.id, today),
      listRecentTasks(user.id, 60),
    ])
    if (gErr || tErr) setError((gErr || tErr).message)
    setGoals(g || [])
    setTodayTasks(t || [])
    setRecent(r || [])
    setLoading(false)
  }, [user, today])

  useEffect(() => { load() }, [load])

  const activeGoals = goals.filter((g) => g.status === 'active')

  const stats = useMemo(() => {
    const completedToday = todayTasks.filter((t) => t.is_completed).length
    const totalToday = todayTasks.length
    const percentToday = totalToday ? Math.round((completedToday / totalToday) * 100) : 0

    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      return { date: iso, completed: 0, total: 0 }
    })
    for (const t of recent) {
      const slot = last7.find((s) => s.date === t.due_date)
      if (slot) {
        slot.total += 1
        if (t.is_completed) slot.completed += 1
      }
    }

    let streak = 0
    for (const day of last7) {
      if (day.total > 0 && day.completed === day.total) streak += 1
      else break
    }

    const weekCompleted = last7.reduce((s, d) => s + d.completed, 0)
    const weekTotal = last7.reduce((s, d) => s + d.total, 0)
    const weekPercent = weekTotal ? Math.round((weekCompleted / weekTotal) * 100) : 0

    return { completedToday, totalToday, percentToday, streak, weekPercent, weekCompleted, weekTotal }
  }, [todayTasks, recent])

  const tipOfTheDay = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000)
    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length]
  }, [])

  async function toggleTask(task) {
    const { data, error } = await setTaskCompleted(task.id, !task.is_completed)
    if (error) {
      setError(error.message)
      return
    }
    setTodayTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)))
    setRecent((prev) => prev.map((t) => (t.id === task.id ? data : t)))
  }

  async function removeTask(task) {
    if (!confirm(`Delete task "${task.title}"?`)) return
    const { error } = await deleteTask(task.id)
    if (error) {
      setError(error.message)
      return
    }
    setTodayTasks((prev) => prev.filter((t) => t.id !== task.id))
    setRecent((prev) => prev.filter((t) => t.id !== task.id))
  }

  function openAdd() {
    setNewTaskTitle('')
    setNewTaskGoalId(activeGoals[0]?.id || '')
    setAdding(true)
  }

  async function handleGenerate(goalId) {
    setGeneratingFor(goalId)
    setError(null)
    const { data, error } = await generateTasksForGoal(goalId)
    setGeneratingFor(null)
    if (error) {
      setError(`AI task generation failed: ${error.message}`)
      return
    }
    const newTasks = data?.tasks || []
    if (newTasks.length === 0) {
      setError('AI returned no tasks. Try again or refine the goal description.')
      return
    }
    setTodayTasks((prev) => [...prev, ...newTasks])
    setRecent((prev) => [...newTasks, ...prev])
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setSaving(true)
    setError(null)
    const { data, error } = await createTask(user.id, {
      title: newTaskTitle.trim(),
      due_date: today,
      goal_id: newTaskGoalId || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setTodayTasks((prev) => [...prev, data])
    setRecent((prev) => [data, ...prev])
    setAdding(false)
  }

  const firstName = (profile?.full_name || '').split(' ')[0]

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{firstName ? `Welcome back, ${firstName}` : 'Welcome back'} 👋</h1>
          <div className="subtitle">
            {today} · {stats.completedToday}/{stats.totalToday || 0} tasks done today
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/goals" className="btn ghost">Manage goals</Link>
          <button className="btn primary" onClick={openAdd}>+ Add task</button>
        </div>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 18 }}>
            <div className="stat-tile">
              <span className="stat-label">Today</span>
              <span className="stat-value">{stats.percentToday}%</span>
              <span className="stat-sub">{stats.completedToday} of {stats.totalToday || 0} done</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">7-day</span>
              <span className="stat-value">{stats.weekPercent}%</span>
              <span className="stat-sub">{stats.weekCompleted}/{stats.weekTotal} tasks</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{stats.streak}</span>
              <span className="stat-sub">perfect day{stats.streak === 1 ? '' : 's'} in a row</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Active goals</span>
              <span className="stat-value">{activeGoals.length}</span>
              <span className="stat-sub">{goals.length - activeGoals.length} other</span>
            </div>
          </section>

          <section className="card rounded-xl" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Today's focus</h3>
              <button className="btn small ghost" onClick={openAdd}>+ Add</button>
            </div>

            {loading ? (
              <Spinner />
            ) : todayTasks.length === 0 ? (
              <EmptyState
                icon="🌱"
                title="No tasks for today yet"
                description="Add a small, concrete action — something you can actually finish in 15 minutes."
                action={<button className="btn primary" onClick={openAdd}>+ Add a task</button>}
              />
            ) : (
              <ul className="task-list">
                {todayTasks.map((t) => (
                  <li key={t.id} className={`task-item ${t.is_completed ? 'completed' : ''}`}>
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={t.is_completed}
                      onChange={() => toggleTask(t)}
                      aria-label={t.is_completed ? 'Mark incomplete' : 'Mark complete'}
                    />
                    <div className="task-body">
                      <div className="task-title">{t.title}</div>
                      {t.description && <div className="task-description">{t.description}</div>}
                      <div className="task-meta">
                        {t.ai_generated && <span className="badge sun">✨ AI</span>}
                        {t.goals?.title && <span className="badge">{t.goals.title}</span>}
                        {t.goals?.category && <span className="badge gray">{t.goals.category}</span>}
                        {t.is_completed && <span className="badge mint">Completed</span>}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className="btn-icon" title="Delete" onClick={() => removeTask(t)}>🗑</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ marginBottom: 18 }}>
            <h3 style={{ marginBottom: 10 }}>Active goals</h3>
            {loading ? (
              <Spinner />
            ) : activeGoals.length === 0 ? (
              <EmptyState
                icon="🎯"
                title="No active goals"
                description="Goals give your daily tasks meaning. Define what you're working toward."
                action={<Link to="/goals" className="btn primary">+ Add a goal</Link>}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {activeGoals.slice(0, 4).map((g) => (
                  <div key={g.id} className="goal-card">
                    <div className="goal-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4>{g.title}</h4>
                        {g.category && <span className="badge" style={{ marginTop: 6 }}>{g.category}</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                        <span>Progress</span><span>{g.progress_percent}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${g.progress_percent}%` }} /></div>
                    </div>
                    <button
                      className="btn small primary"
                      onClick={() => handleGenerate(g.id)}
                      disabled={generatingFor === g.id}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {generatingFor === g.id ? 'Generating…' : '✨ Generate today\'s tasks'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h4 style={{ marginTop: 0 }}>💡 Tip of the day</h4>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{tipOfTheDay}</p>
          </section>
        </main>

        <Sidebar />
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a task for today"
        footer={
          <>
            <button type="button" className="btn subtle" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" form="add-task-form" className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add task'}
            </button>
          </>
        }
      >
        <form id="add-task-form" className="form-grid" onSubmit={handleAdd}>
          <div className="form-row">
            <label htmlFor="task-title">Task *</label>
            <input
              id="task-title"
              className="form-input"
              required
              autoFocus
              placeholder="e.g. Write the first paragraph of the article"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <span className="form-help">Make it small enough to finish today.</span>
          </div>

          <div className="form-row">
            <label htmlFor="task-goal">Connect to a goal (optional)</label>
            <select
              id="task-goal"
              className="form-select"
              value={newTaskGoalId}
              onChange={(e) => setNewTaskGoalId(e.target.value)}
            >
              <option value="">— No goal —</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
