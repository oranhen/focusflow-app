import React from 'react'

export default function DailyTaskCard({title,tasks=[]}){
  return (
    <div className="card">
      <h4 style={{marginTop:0}}>{title}</h4>
      <ul>
        {tasks.map((t,i)=>(<li key={i}>{t}</li>))}
      </ul>
    </div>
  )
}
