import React, {useState, useEffect, useRef} from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar(){
  const nav = useNavigate()
  const [open,setOpen] = useState(false)
  const backdropRef = useRef()

  const links = [
    {to:'/',label:'Home'},
    {to:'/pricing',label:'Pricing'},
    {to:'/dashboard',label:'Dashboard'},
    {to:'/progress',label:'Progress'},
  ]

  useEffect(()=>{
    function onKey(e){
      if(e.key === 'Escape') setOpen(false)
    }
    if(open) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[open])

  return (
    <header className="navbar" style={{position:'relative',zIndex:50}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div className="brand">FocusFlow</div>
        <nav className="nav-links" style={{display:'flex',gap:10}}>
          {links.map(l=> <Link key={l.to} to={l.to}>{l.label}</Link>)}
        </nav>
      </div>

      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className="nav-cta secondary" onClick={()=>nav('/login')}>Login</button>
        <button className="nav-cta" onClick={()=>nav('/register')}>Get Started</button>
        <button className="hamburger" onClick={()=>setOpen(true)} aria-label="Open menu">☰</button>
      </div>

      <div className={`drawer-backdrop ${open? 'open':''}`} ref={backdropRef} onClick={()=>setOpen(false)} />

      <div className={`mobile-drawer ${open? 'open':''}`} role="dialog" aria-hidden={!open} aria-modal={open}>
        <button className="close" onClick={()=>setOpen(false)}>✕</button>
        <nav>
          {links.map(l=> (
            <Link key={l.to} to={l.to} onClick={()=>setOpen(false)} style={{display:'block',padding:'10px 6px'}}>{l.label}</Link>
          ))}
          <div style={{marginTop:12}}>
            <button className="nav-cta" onClick={()=>{setOpen(false);nav('/register')}}>Get Started</button>
          </div>
        </nav>
      </div>
    </header>
  )
}
