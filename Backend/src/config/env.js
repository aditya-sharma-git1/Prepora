const requiredEnvVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "GOOGLE_GENAI_API_KEY"
]

function validateEnv() {
    const missing = requiredEnvVars.filter((key) => !process.env[key])

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }
}

module.exports = { validateEnv }
