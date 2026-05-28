import React from 'react'

export default function TestimonialCard({quote,author}){
  return (
    <div className="card">
      <p className="testimonial-quote">“{quote}”</p>
      <div style={{marginTop:12,fontWeight:700,color:'var(--muted)'}}>- {author}</div>
    </div>
  )
}
