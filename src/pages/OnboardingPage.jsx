import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingPage(){
  const nav = useNavigate()
  return (
    <div className="container">
      <div className="card" style={{maxWidth:720,margin:'0 auto'}}>
        <h2>Welcome — Onboarding</h2>
        <p style={{color:'var(--muted)'}}>Tell us a bit about your goals and we'll create a first plan.</p>
        <div style={{display:'grid',gap:8,marginTop:8}}>
          <input placeholder="What is your main goal?" />
          <select>
            <option>Career</option>
            <option>Study</option>
            <option>Health</option>
          </select>
          <div style={{marginTop:12}}>
            <button className="nav-cta" onClick={()=>nav('/dashboard')}>Finish</button>
          </div>
        </div>
      </div>
    </div>
  )
}
