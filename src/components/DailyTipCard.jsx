import React from 'react'

export default function DailyTipCard({tip}){
  return (
    <div className="card">
      <h4 style={{marginTop:0}}>Daily Tip</h4>
      <p style={{color:'var(--muted)'}}>{tip}</p>
    </div>
  )
}
