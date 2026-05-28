import React from 'react'

export default function Button({children,variant='primary',...props}){
  const style = {
    padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer'
  }
  if(variant==='secondary'){
    style.background='transparent';style.border=`1px solid var(--primary)`;style.color='var(--primary)'
  } else {
    style.background='var(--primary)';style.color='#fff'
  }
  return <button style={style} {...props}>{children}</button>
}
