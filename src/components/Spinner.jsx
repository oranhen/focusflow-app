import React from 'react'

export default function Spinner({ label = 'Loading…', inline = false }) {
  return (
    <div className={`spinner ${inline ? 'spinner-inline' : ''}`} role="status" aria-live="polite">
      <span className="spinner-dot" />
      <span className="spinner-dot" />
      <span className="spinner-dot" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
