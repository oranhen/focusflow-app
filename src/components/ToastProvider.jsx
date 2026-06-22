import React, { createContext, useCallback, useContext, useState, useRef } from 'react'

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const tm = timers.current.get(id)
    if (tm) {
      clearTimeout(tm)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback((toast) => {
    const id = nextId++
    const t = { id, variant: 'info', duration: 4000, ...toast }
    setToasts((prev) => [...prev, t])
    if (t.duration > 0) {
      const tm = setTimeout(() => dismiss(id), t.duration)
      timers.current.set(id, tm)
    }
    return id
  }, [dismiss])

  const api = {
    push,
    success: (message, opts) => push({ variant: 'success', message, ...opts }),
    error: (message, opts) => push({ variant: 'error', message, duration: 6000, ...opts }),
    info: (message, opts) => push({ variant: 'info', message, ...opts }),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`} role="status">
            <span className="toast-icon" aria-hidden="true">
              {t.variant === 'success' ? '✓' : t.variant === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
