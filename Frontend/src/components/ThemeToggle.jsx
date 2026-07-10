import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { SunIcon, MoonIcon } from './icons.jsx'

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            className='theme-toggle'
            type='button'
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
    )
}

export default ThemeToggle
