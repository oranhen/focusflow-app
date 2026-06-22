import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listGoals, createGoal, updateGoal, deleteGoal, generateTasksForGoal } from '../lib/api'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

const CATEGORIES = ['career', 'study', 'health', 'personal', 'other']
const STATUSES = ['active', 'completed', 'paused']

const EMPTY_GOAL = { title: '', description: '', category: 'career', target_date: '', status: 'active', progress_percent: 0 }

export default function GoalsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  useDocumentTitle('Goals')
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // null | { ...goal } (id present = edit)
  const [saving, setSaving] = useState(false)
  const [generatingFor, setGeneratingFor] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await listGoals(user.id)
    if (error) setError(error.message)
    else setGoals(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  function openNew() { setEditing({ ...EMPTY_GOAL }) }
  function openEdit(goal) { setEditing({ ...goal, target_date: goal.target_date || '' }) }
  function closeModal() { setEditing(null) }

  async function handleSave(e) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError(null)

    const payload = {
      title: editing.title.trim(),
      description: editing.description?.trim() || null,
      category: editing.category,
      target_date: editing.target_date || null,
      status: editing.status,
      progress_percent: Number(editing.progress_percent) || 0,
    }

    const result = editing.id
      ? await updateGoal(editing.id, payload)
      : await createGoal(user.id, payload)

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }
    closeModal()
    await load()
  }

  async function handleGenerate(goal) {
    setGeneratingFor(goal.id)
    setError(null)
    const { data, error } = await generateTasksForGoal(goal.id)
    setGeneratingFor(null)
    if (error) {
      toast.error(`AI task generation failed: ${error.message}`)
      return
    }
    const count = data?.tasks?.length || 0
    toast.success(`Generated ${count} AI task${count === 1 ? '' : 's'} for today — see them on the Dashboard.`)
  }

  async function handleDelete(goal) {
    const ok = await confirm({
      title: 'Delete goal?',
      message: `"${goal.title}" will be removed along with all its daily tasks and progress entries. This cannot be undone.`,
      confirmLabel: 'Delete goal',
      danger: true,
    })
    if (!ok) return
    const { error } = await deleteGoal(goal.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Goal deleted.')
    await load()
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Your goals</h1>
          <div className="subtitle">Long-term goals that drive your daily focus.</div>
        </div>
        <button className="btn primary" onClick={openNew}>+ New goal</button>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
      {loading ? (
        <Spinner />
      ) : goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Start by adding one clear goal. We'll turn it into a small daily action you can actually do."
          action={<button className="btn primary" onClick={openNew}>+ Add your first goal</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {goals.map((g) => (
            <article key={g.id} className="goal-card">
              <div className="goal-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4>{g.title}</h4>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {g.category && <span className="badge">{g.category}</span>}
                    <span className={`badge ${g.status === 'completed' ? 'mint' : g.status === 'paused' ? 'gray' : ''}`}>
                      {g.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-icon" title="Edit" onClick={() => openEdit(g)}>✎</button>
                  <button className="btn-icon" title="Delete" onClick={() => handleDelete(g)}>🗑</button>
                </div>
              </div>

              {g.description && (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{g.description}</p>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                  <span>Progress</span>
                  <span>{g.progress_percent}%</span>
                </div>
                <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${g.progress_percent}%` }} /></div>
              </div>

              {g.target_date && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Target: {new Date(g.target_date).toLocaleDateString()}
                </div>
              )}

              {g.status === 'active' && (
                <button
                  className="btn small primary"
                  onClick={() => handleGenerate(g)}
                  disabled={generatingFor === g.id}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {generatingFor === g.id ? 'Generating…' : '✨ Generate today\'s tasks'}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

        </main>
        <Sidebar />
      </div>

      <Modal
        open={!!editing}
        onClose={closeModal}
        title={editing?.id ? 'Edit goal' : 'New goal'}
        footer={
          <>
            <button type="button" className="btn subtle" onClick={closeModal}>Cancel</button>
            <button type="submit" form="goal-form" className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save goal'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="goal-form" className="form-grid" onSubmit={handleSave}>
            <div className="form-row">
              <label htmlFor="goal-title">Title *</label>
              <input
                id="goal-title"
                className="form-input"
                required
                maxLength={200}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>

            <div className="form-row">
              <label htmlFor="goal-desc">Description</label>
              <textarea
                id="goal-desc"
                className="form-textarea"
                placeholder="Why does this goal matter? What does success look like?"
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-row">
                <label htmlFor="goal-cat">Category</label>
                <select
                  id="goal-cat"
                  className="form-select"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="goal-status">Status</label>
                <select
                  id="goal-status"
                  className="form-select"
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-row">
                <label htmlFor="goal-date">Target date</label>
                <input
                  id="goal-date"
                  type="date"
                  className="form-input"
                  value={editing.target_date || ''}
                  onChange={(e) => setEditing({ ...editing, target_date: e.target.value })}
                />
              </div>

              <div className="form-row">
                <label htmlFor="goal-prog">Progress ({editing.progress_percent}%)</label>
                <input
                  id="goal-prog"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={editing.progress_percent}
                  onChange={(e) => setEditing({ ...editing, progress_percent: Number(e.target.value) })}
                />
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
