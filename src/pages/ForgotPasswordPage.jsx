import React from 'react'

export default function ForgotPasswordPage(){
  return (
    <div className="container">
      <div className="card" style={{maxWidth:420,margin:'0 auto'}}>
        <h2>Reset password</h2>
        <p style={{color:'var(--muted)'}}>Enter your email to receive reset instructions.</p>
        <input type="email" placeholder="you@example.com" style={{width:'100%',padding:10,borderRadius:8,border:'1px solid var(--border)'}} />
        <div style={{marginTop:12}}><button className="nav-cta">Send reset link</button></div>
      </div>
    </div>
  )
}
