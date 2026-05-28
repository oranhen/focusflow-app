import React from 'react'
import Sidebar from '../components/Sidebar'
import AIInsightsCard from '../components/AIInsightsCard'

export default function ProgressPage(){
  return (
    <div className="container">
      <div className="dashboard-grid">
        <main>
          <section className="card" style={{marginBottom:12}}>
            <h3>Progress over time</h3>
            <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>Chart placeholder</div>
          </section>

          <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
            <div className="card">
              <h4>Streak calendar</h4>
              <div style={{height:100,color:'var(--muted)'}}>Calendar placeholder</div>
            </div>
            <AIInsightsCard insights={["You are more consistent on weekdays","Focus on one key task per day"]} />
          </section>
        </main>

        <Sidebar />
      </div>
    </div>
  )
}
