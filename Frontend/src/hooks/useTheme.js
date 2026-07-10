import { useEffect, useState } from 'react'

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("prepview-theme")

    if (savedTheme) {
        return savedTheme
    }

    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

export function useTheme() {
    const [ theme, setTheme ] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        localStorage.setItem("prepview-theme", theme)
    }, [ theme ])

    const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"))

    return { theme, toggleTheme }
}
