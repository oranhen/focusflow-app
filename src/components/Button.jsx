import React from 'react'

export default function Button({children,variant='primary',className='',...props}){
  const cls = variant === 'secondary' ? 'btn-outline' : 'btn-primary'
  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  )
}
