import React from 'react'

export default function GoalStatusCard({title,stat}){
  return (
    <div className="card">
      <h4 style={{marginTop:0}}>{title}</h4>
      <div style={{fontSize:20,fontWeight:700}}>{stat}</div>
    </div>
  )
}
