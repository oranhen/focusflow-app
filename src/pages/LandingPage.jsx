import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FeatureCard from '../components/FeatureCard'
import TestimonialCard from '../components/TestimonialCard'

export default function LandingPage(){
  const nav = useNavigate()
  return (
    <div className="container">
      <section className="hero card rounded-xl">
        <div className="hero-left">
          <h1>FocusFlow — Turn goals into daily actions</h1>
          <p>AI-guided productivity that translates your big goals into clear, practical daily steps.</p>
          <div className="hero-cta" style={{justifyContent:'flex-start',marginTop:12}}>
            <button className="btn-primary" onClick={()=>nav('/register')}>Get Started</button>
            <button className="btn-outline" onClick={()=>nav('/login')}>Login</button>
            <button className="btn-outline" onClick={()=>nav('/pricing')}>View Plans</button>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-image">App preview</div>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h3>Key Benefits</h3>
        <div className="features">
          <FeatureCard title="Daily Focus">A single clear daily priority to keep momentum.</FeatureCard>
          <FeatureCard title="AI Guidance">Personalized recommendations and weekly analysis.</FeatureCard>
          <FeatureCard title="Progress Tracking">Understand how you improve over time.</FeatureCard>
        </div>
      </section>

      <section style={{marginTop:28}}>
        <h3>What users say</h3>
        <div className="testimonials">
          <TestimonialCard quote="Helped me actually finish projects." author="Dafna" />
          <TestimonialCard quote="Short daily steps made a huge difference." author="Oran" />
          <TestimonialCard quote="Clear and calm UI to stay focused." author="Lior" />
        </div>
      </section>

      <section style={{marginTop:28,textAlign:'center'}}>
        <h3>Ready to start?</h3>
        <div style={{display:'inline-block'}}>
          <button className="btn-primary" onClick={()=>nav('/register')}>Start free</button>
        </div>
      </section>
    </div>
  )
}
