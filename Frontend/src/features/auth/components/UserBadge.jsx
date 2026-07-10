import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { SunIcon, MoonIcon, LogoutIcon } from '../../../components/icons.jsx'

const UserBadge = () => {
    const { user, handleLogout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [ open, setOpen ] = useState(false)
    const containerRef = useRef(null)

    // close the dropdown on outside click/tap, and on Escape
    useEffect(() => {
        if (!open) return

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [ open ])

    if (!user) {
        return null
    }

    const initial = user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"
    const isLight = theme === 'light'

    return (
        <div className='user-menu' ref={containerRef}>
            <button
                type='button'
                className='user-menu__trigger'
                aria-label='Account menu'
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
            >
                {initial}
            </button>

            {open && (
                <div className='user-menu__panel' role='menu'>
                    <div className='user-menu__identity'>
                        <div className='user-menu__avatar' aria-hidden='true'>{initial}</div>
                        <div className='user-menu__details'>
                            <span className='user-menu__name'>{user.username}</span>
                            <span className='user-menu__email'>{user.email}</span>
                        </div>
                    </div>

                    <div className='user-menu__divider' />

                    <button type='button' className='user-menu__row' onClick={toggleTheme}>
                        <span className='user-menu__row-icon' aria-hidden='true'>{isLight ? <MoonIcon width={14} height={14} /> : <SunIcon width={14} height={14} />}</span>
                        <span>Switch to {isLight ? 'Dark' : 'Light'} mode</span>
                    </button>

                    <button type='button' className='user-menu__row user-menu__row--danger' onClick={handleLogout}>
                        <span className='user-menu__row-icon' aria-hidden='true'><LogoutIcon width={14} height={14} /></span>
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    )
}

export default UserBadge
