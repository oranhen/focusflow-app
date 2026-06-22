import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Footer() {
  const { user } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer className="footer-pro">
      <div className="container footer-pro-inner">
        <div className="footer-pro-brand">
          <div className="brand">FocusFlow</div>
          <p style={{ color: 'var(--muted)', margin: '6px 0 0', fontSize: 13, maxWidth: 320 }}>
            Turn your big goal into today's three actions — powered by AI.
          </p>
        </div>

        <div className="footer-pro-cols">
          <div className="footer-pro-col">
            <h5>Product</h5>
            <Link to="/">Home</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/forum">Community</Link>
          </div>

          <div className="footer-pro-col">
            <h5>Account</h5>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/profile">Profile</Link>
                <Link to="/settings">Settings</Link>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create account</Link>
              </>
            )}
          </div>

          <div className="footer-pro-col">
            <h5>Resources</h5>
            <a href="https://github.com/oranhen/focusflow-app" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://supabase.com" target="_blank" rel="noreferrer">Powered by Supabase</a>
            <a href="https://ai.google.dev" target="_blank" rel="noreferrer">AI by Google Gemini</a>
          </div>
        </div>
      </div>

      <div className="footer-pro-base container">
        <span>© {year} FocusFlow · Course capstone by Oran Chen</span>
      </div>
    </footer>
  )
}
