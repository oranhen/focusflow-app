import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="container" style={{ padding: 32, maxWidth: 640 }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>🛟</div>
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p style={{ color: 'var(--muted)' }}>
            FocusFlow hit an unexpected error. Refreshing usually fixes it.
          </p>
          <pre style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted)', background: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 200 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn primary" onClick={() => location.reload()}>Reload</button>
            <button className="btn ghost" onClick={this.reset}>Try again</button>
          </div>
        </div>
      </div>
    )
  }
}
