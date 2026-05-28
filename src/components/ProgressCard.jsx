import React from 'react'

export default function ProgressCard({title,value,subtitle}){
  return (
    <div className="card">
      <h4 style={{margin:0}}>{title}</h4>
      <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div className="progress-ring">{value}</div>
        <div style={{color:'var(--muted)'}}>{subtitle}</div>
      </div>
    </div>
  )
}
