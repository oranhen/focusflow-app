import React from 'react'
import Sidebar from '../components/Sidebar'
import ProgressCard from '../components/ProgressCard'
import DailyTaskCard from '../components/DailyTaskCard'
import DailyTipCard from '../components/DailyTipCard'
import GoalStatusCard from '../components/GoalStatusCard'

export default function DashboardPage(){
  return (
    <div className="container">
      <div className="dashboard-grid">
        <main>
          <section className="card rounded-xl" style={{marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h2 style={{margin:0}}>Progress this week</h2>
                <div style={{color:'var(--muted)'}}>68% — Keep going — +3% vs last week</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="progress-ring">68%</div>
                <div style={{color:'var(--muted)',fontSize:12}}>Current streak: 5 days</div>
              </div>
            </div>
          </section>

          <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
            <ProgressCard title="Focus" value="68%" subtitle="Progress this week" />
            <GoalStatusCard title="Current streak" stat="5 days" />
            <GoalStatusCard title="Completed today" stat="1" />
            <DailyTipCard tip="Break big goals into 15-minute focused blocks." />
          </section>

          <section style={{marginTop:18}}>
            <h3>Today's Focus</h3>
            <DailyTaskCard title="Complete one small career-related action" tasks={["Update CV bullet","Send one outreach email","Spend 30 min learning"]} />
          </section>
        </main>

        <Sidebar />
      </div>
    </div>
  )
}
