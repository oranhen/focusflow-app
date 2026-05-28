import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container">
        <div style={{marginBottom:8}}>© {new Date().getFullYear()} FocusFlow — AI productivity</div>
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <Link to="/">Home</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/settings">Settings</Link>
        </div>
      </div>
    </footer>
  )
}
