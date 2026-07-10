import React from 'react'
import { Link } from 'react-router'
import ThemeToggle from '../components/ThemeToggle.jsx'

const NotFound = () => (
    <main className='not-found-page'>
        <ThemeToggle />
        <div className='not-found-page__mark'>P</div>
        <h1 className='not-found-page__code'>404</h1>
        <p className='not-found-page__message'>This page doesn't exist — looks like you took a wrong turn.</p>
        <Link to='/' className='button primary-button'>Back to Home</Link>
    </main>
)

export default NotFound
