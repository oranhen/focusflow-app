import React from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Not found')
  return (
    <div className="container" style={{ padding: 32 }}>
      <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🧭</div>
        <h1 style={{ marginTop: 0 }}>This page wandered off</h1>
        <p style={{ color: 'var(--muted)' }}>
          We couldn't find what you were looking for. Maybe the link is old, or the URL has a typo.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <Link to="/" className="btn primary">Back to home</Link>
          <Link to="/dashboard" className="btn ghost">Go to dashboard</Link>
        </div>
      </div>
    </div>
  )
}
