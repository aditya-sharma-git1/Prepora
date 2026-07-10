import React from 'react'

const LoadingScreen = ({ message = 'Loading...' }) => (
    <main className='loading-screen'>
        <div className='loading-screen__badge'>
            <span className='loading-screen__mark'>P</span>
            <span className='loading-screen__ring' aria-hidden='true' />
        </div>
        <p className='loading-screen__message'>{message}</p>
    </main>
)

export default LoadingScreen
