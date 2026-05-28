import React from 'react'

export default function FeatureCard({title,children,icon}){
  return (
    <div className="feature card">
      <div className="icon">{icon || '★'}</div>
      <h4 style={{marginTop:6}}>{title}</h4>
      <p style={{color:'var(--muted)',marginTop:8}}>{children}</p>
    </div>
  )
}
