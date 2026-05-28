import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage(){
  const nav = useNavigate()
  return (
    <div className="container">
      <div className="card" style={{maxWidth:480,margin:'0 auto'}}>
        <h2>Create account</h2>
        <p style={{color:'var(--muted)'}}>Sign up and start your free trial.</p>
        <form onSubmit={(e)=>{e.preventDefault();nav('/onboarding')}}>
          <label style={{display:'block',marginTop:8}}>Email</label>
          <input required type="email" style={{width:'100%',padding:10,borderRadius:8,border:'1px solid var(--border)'}} />
          <label style={{display:'block',marginTop:8}}>Password</label>
          <input required type="password" style={{width:'100%',padding:10,borderRadius:8,border:'1px solid var(--border)'}} />
          <div style={{marginTop:12}}>
            <button className="nav-cta" type="submit">Create account</button>
          </div>
        </form>
      </div>
    </div>
  )
}
