import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage(){
  const nav = useNavigate()
  return (
    <div className="container">
      <div className="card" style={{maxWidth:420,margin:'0 auto'}}>
        <h2>Login</h2>
        <form onSubmit={(e)=>{e.preventDefault();nav('/dashboard')}}>
          <label>Email</label>
          <input type="email" required style={{width:'100%',padding:10,borderRadius:8,border:'1px solid var(--border)'}} />
          <label style={{marginTop:8}}>Password</label>
          <input type="password" required style={{width:'100%',padding:10,borderRadius:8,border:'1px solid var(--border)'}} />
          <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <button className="nav-cta" type="submit">Sign in</button>
            <a href="/forgot-password" style={{color:'var(--muted)'}}>Forgot?</a>
          </div>
        </form>
      </div>
    </div>
  )
}
