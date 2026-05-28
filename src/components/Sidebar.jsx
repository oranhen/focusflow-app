import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar(){
  const items = [
    {to:'/dashboard',label:'Dashboard',icon:'🏠'},
    {to:'/progress',label:'Progress',icon:'📈'},
    {to:'/chatbot',label:'Chatbot',icon:'💬'},
    {to:'/forum',label:'Forum',icon:'💬'},
  ]

  return (
    <aside className="sidebar">
      <div className="card" style={{padding:'12px'}}>
        <nav style={{display:'flex',flexDirection:'column',gap:8}}>
          {items.map(i=> (
            <NavLink key={i.to} to={i.to} style={({isActive})=>({display:'flex',gap:10,alignItems:'center',padding:'8px 12px',borderRadius:10,textDecoration:'none',color:isActive? 'var(--primary)': 'var(--muted)',background:isActive? 'rgba(107,70,193,0.05)': 'transparent'})}>
              <span style={{fontSize:16}}>{i.icon}</span>
              <span>{i.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
