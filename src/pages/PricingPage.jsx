import React from 'react'
import PricingCard from '../components/PricingCard'

export default function PricingPage(){
  const plans = [
    {plan:'Free',price:'₪0',features:['Basic daily actions','Up to 1 goal']},
    {plan:'Pro',price:'₪29 / mo',features:['Unlimited goals','Weekly insights','Priority support'], highlight:true},
    {plan:'Premium',price:'₪59 / mo',features:['Coaching tips','Advanced analytics','Team features']}
  ]
  return (
    <div className="container">
      <header style={{marginBottom:12}}>
        <h1>Pricing</h1>
        <p style={{color:'var(--muted)'}}>Simple plans for individuals and teams.</p>
      </header>
      <div className="pricing-cards">
        {plans.map(p=>(<PricingCard key={p.plan} plan={p.plan} price={p.price} features={p.features} cta={`Choose ${p.plan}`} highlight={p.highlight} />))}
      </div>
    </div>
  )
}
