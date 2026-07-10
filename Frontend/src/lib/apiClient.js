import axios from "axios"

// Base URL comes from an env var, not a hardcoded string, so switching between
// local development and your own deployed backend is just a .env change -
// never something that has to be hand-edited (and accidentally left pointing
// at someone else's server) in multiple files.
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

export const api = axios.create({
    baseURL,
    withCredentials: true
})
