import React,{useState} from 'react'
import { useNavigate, Link, Navigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import Spinner from '../../../components/Spinner.jsx'
import "../auth.form.scss"

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const {user,loading,authError,handleRegister} = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        const user = await handleRegister({username,email,password})
        if (user) {
            navigate("/dashboard")
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
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            value={username}
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' />
                    </div>
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
                        {loading ? "Creating account..." : "Register"}
                    </button>

                </form>

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register
