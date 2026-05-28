import React from 'react'

export default function PricingCard({plan,price,features,cta,highlight=false}){
  return (
    <div className={`pricing-card card ${highlight? 'recommended':''}`}>
      <h3 style={{margin:0}}>{plan}</h3>
      <div className="price">{price}</div>
      <ul style={{marginTop:10}}>
        {features.map((f,i)=>(
          <li key={i} style={{marginBottom:8,display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
            <span style={{color:'var(--tertiary)'}}>{'✓'}</span>
            <span style={{color:'var(--muted)'}}>{f}</span>
          </li>
        ))}
      </ul>
      <div style={{marginTop:12}}>
        <button className="btn-primary" onClick={()=>{window.location.pathname='/register'}}>{cta||'Choose'}</button>
      </div>
    </div>
  )
}
