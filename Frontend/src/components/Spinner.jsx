import React from 'react'

const Spinner = ({ size = 'sm', className = '' }) => (
    <span className={`loading-spinner loading-spinner--${size} ${className}`} aria-hidden='true' />
)

export default Spinner
