import React, { createContext, useCallback, useContext, useState } from 'react'
import Modal from './Modal'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null) // { title, message, confirmLabel, cancelLabel, danger, resolve }

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({
        title: 'Are you sure?',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: false,
        ...opts,
        resolve,
      })
    })
  }, [])

  function handle(result) {
    state?.resolve?.(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => handle(false)}
        title={state?.title || ''}
        footer={
          <>
            <button type="button" className="btn subtle" onClick={() => handle(false)}>
              {state?.cancelLabel || 'Cancel'}
            </button>
            <button
              type="button"
              className={`btn ${state?.danger ? 'danger' : 'primary'}`}
              onClick={() => handle(true)}
              autoFocus
            >
              {state?.confirmLabel || 'Confirm'}
            </button>
          </>
        }
      >
        {state?.message && (
          <p style={{ margin: 0, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{state.message}</p>
        )}
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx
}
