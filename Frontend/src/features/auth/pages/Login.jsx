import React,{useState} from 'react'
import { useNavigate, Link, Navigate } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import Spinner from '../../../components/Spinner.jsx'

const Login = () => {

    const { user, loading, authError, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        const user = await handleLogin({email,password})
        if (user) {
            navigate('/dashboard')
        }
    }

    if(user){
        return <Navigate to={'/dashboard'} replace />
    }


    return (
        <main className='auth-shell'>
            <ThemeToggle />
            <div className="form-container">
                <div className='auth-brand'>
                    <span className='auth-brand__mark'>P</span>
                    <div>
                        <p className='auth-brand__name'>Prepora</p>
                        <p className='auth-brand__tagline'>Interview prep, focused.</p>
                    </div>
                </div>
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    {authError && <p className='auth-error'>{authError}</p>}
                    <button className='button primary-button' disabled={loading}>
                        {loading && <Spinner size='sm' />}
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>
        </main>
    )
}

export default Login
