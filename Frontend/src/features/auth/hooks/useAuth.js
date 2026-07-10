import { useCallback, useContext, useEffect } from "react";
import { AuthContext } from "../auth.context-value";
import { login, register, logout, getMe } from "../services/auth.api";
import { useToast } from "../../../components/Toast/useToast";



export const useAuth = () => {

    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    const { user, setUser, loading, setLoading, authError, setAuthError } = context
    const { showToast } = useToast()


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        setAuthError("")
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return data.user
        } catch (error) {
            setUser(null)
            const message = error.response?.data?.message || error.message || "Unable to login. Please try again."
            setAuthError(message)
            showToast(message, 'error')
            return null
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        setAuthError("")
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            return data.user
        } catch (error) {
            setUser(null)
            const message = error.response?.data?.message || error.message || "Unable to register. Please try again."
            setAuthError(message)
            showToast(message, 'error')
            return null
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        setAuthError("")
        try {
            await logout()
            setUser(null)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const getAndSetUser = useCallback(async () => {
        try {
            const data = await getMe()
            setUser(data.user)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [ setLoading, setUser ])

    useEffect(() => {
        getAndSetUser()
    }, [ getAndSetUser ])

    return { user, loading, authError, handleRegister, handleLogin, handleLogout }
}
