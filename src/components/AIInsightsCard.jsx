import React from 'react'

export default function AIInsightsCard({insights=[]}){
  return (
    <div className="card">
      <h4 style={{marginTop:0}}>AI Insights</h4>
      <ul>
        {insights.map((s,i)=>(<li key={i}>{s}</li>))}
      </ul>
    </div>
  )
}
