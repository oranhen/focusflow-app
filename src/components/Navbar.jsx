import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const nav = useNavigate()
  const { user, profile, isAdmin, signOut, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const backdropRef = useRef()

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/forum', label: 'Forum' },
  ]

  const authedLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/goals', label: 'Goals' },
    { to: '/progress', label: 'Progress' },
    { to: '/chatbot', label: 'Chatbot' },
  ]

  const adminLinks = [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/statistics', label: 'Stats' },
  ]

  const links = user ? [...publicLinks, ...authedLinks, ...(isAdmin ? adminLinks : [])] : publicLinks

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    nav('/', { replace: true })
  }

  return (
    <header className="navbar" style={{ position: 'relative', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to={user ? '/dashboard' : '/'} className="brand" style={{ textDecoration: 'none' }}>
          FocusFlow
        </Link>
        <nav className="nav-links" style={{ display: 'flex', gap: 10 }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!loading && user ? (
          <>
            <Link to="/profile" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              {profile?.full_name || user.email}
            </Link>
            <button className="nav-cta secondary" onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <button className="nav-cta secondary" onClick={() => nav('/login')}>Login</button>
            <button className="nav-cta" onClick={() => nav('/register')}>Get Started</button>
          </>
        )}
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
      </div>

      <div className={`drawer-backdrop ${open ? 'open' : ''}`} ref={backdropRef} onClick={() => setOpen(false)} />

      <div className={`mobile-drawer ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open} aria-modal={open}>
        <button className="close" onClick={() => setOpen(false)}>✕</button>
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{ display: 'block', padding: '10px 6px' }}>
              {l.label}
            </Link>
          ))}
          <div style={{ marginTop: 12 }}>
            {user ? (
              <button className="nav-cta" onClick={handleSignOut}>Sign out</button>
            ) : (
              <button className="nav-cta" onClick={() => { setOpen(false); nav('/register') }}>Get Started</button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
