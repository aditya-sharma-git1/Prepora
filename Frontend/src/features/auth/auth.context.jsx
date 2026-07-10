import { useState } from "react";
import { AuthContext } from "./auth.context-value";


export const AuthProvider = ({ children }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState("")

    


    return (
        <AuthContext.Provider value={{user,setUser,loading,setLoading,authError,setAuthError}} >
            {children}
        </AuthContext.Provider>
    )

    
}
