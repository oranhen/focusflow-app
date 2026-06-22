import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listChatMessages, appendChatMessage, chatWithAI } from '../lib/api'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import useDocumentTitle from '../hooks/useDocumentTitle'

const STARTER_PROMPTS = [
  'I feel stuck on my goal. What should I do today?',
  'Suggest a 15-minute action for my main goal.',
  'Why am I losing momentum this week?',
  'How do I stay focused when I have too much to do?',
]

export default function ChatbotPage() {
  useDocumentTitle('Chatbot')
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await listChatMessages(user.id)
    setMessages(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  async function send(messageText) {
    if (!user || !messageText.trim() || sending) return
    setError(null)
    setSending(true)

    // Optimistic insert of the user message
    const optimisticUser = {
      id: `tmp-${Date.now()}`,
      content: messageText,
      is_from_user: true,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])
    setInput('')

    // Persist the user message
    const { data: savedUser, error: insErr } = await appendChatMessage(user.id, messageText, true)
    if (insErr) {
      setError(insErr.message)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id))
      setSending(false)
      return
    }
    setMessages((prev) => prev.map((m) => (m.id === optimisticUser.id ? savedUser : m)))

    // Call the AI
    const { data: ai, error: aiErr } = await chatWithAI(messageText)
    setSending(false)
    if (aiErr) {
      setError(`AI reply failed: ${aiErr.message}`)
      return
    }
    if (ai?.reply) {
      setMessages((prev) => [
        ...prev,
        ai.message || {
          id: `tmp-ai-${Date.now()}`,
          content: ai.reply,
          is_from_user: false,
          created_at: new Date().toISOString(),
        },
      ])
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    send(input)
  }

  const firstName = (profile?.full_name || '').split(' ')[0] || 'there'

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>FocusFlow AI</h1>
          <div className="subtitle">Ask anything about your goals, momentum, or what to do today.</div>
        </div>
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
      <div className="card chat-shell">
        <div className="chat-messages" ref={listRef}>
          {loading ? (
            <Spinner />
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>🤖</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Hi {firstName}!</div>
              <div style={{ fontSize: 14 }}>I'm your FocusFlow coach. Try a suggestion below — or just ask anything.</div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.is_from_user ? 'from-user' : 'from-ai'}`}
              >
                {!m.is_from_user && <div className="chat-bubble-label">FocusFlow AI</div>}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </div>
            ))
          )}
          {sending && (
            <div className="chat-bubble from-ai">
              <div className="chat-bubble-label">FocusFlow AI</div>
              <Spinner inline />
            </div>
          )}
        </div>

        <div className="chat-suggestions" aria-label="Suggested prompts">
          <span className="chat-suggestions-label">💡 Try:</span>
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className="chat-suggestion-chip"
              onClick={() => send(p)}
              disabled={sending}
              title={p}
            >
              {p}
            </button>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            className="form-input"
            placeholder="Ask FocusFlow…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button className="btn primary" type="submit" disabled={sending || !input.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
