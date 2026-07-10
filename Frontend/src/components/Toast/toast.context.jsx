import { createContext, useCallback, useRef, useState } from 'react'
import React from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export const ToastProvider = ({ children }) => {
    const [ toasts, setToasts ] = useState([])
    const timers = useRef({})

    const dismissToast = useCallback((id) => {
        setToasts((current) => current.filter((t) => t.id !== id))
        if (timers.current[ id ]) {
            clearTimeout(timers.current[ id ])
            delete timers.current[ id ]
        }
    }, [])

    const showToast = useCallback((message, type = 'error', duration = 5000) => {
        if (!message) return
        const id = ++idCounter
        setToasts((current) => [ ...current, { id, message, type } ])
        timers.current[ id ] = setTimeout(() => {
            setToasts((current) => current.filter((t) => t.id !== id))
            delete timers.current[ id ]
        }, duration)
        return id
    }, [])

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            <div className='toast-container' role='status' aria-live='polite'>
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast--${t.type}`}>
                        <span className='toast__icon' aria-hidden='true'>
                            {t.type === 'success' ? '✓' : t.type === 'info' ? 'i' : '!'}
                        </span>
                        <span className='toast__message'>{t.message}</span>
                        <button
                            type='button'
                            className='toast__close'
                            aria-label='Dismiss'
                            onClick={() => dismissToast(t.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export default ToastContext
