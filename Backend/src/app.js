const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

// only bypass the origin allowlist for arbitrary localhost ports in development;
// in production this would let any local page make credentialed requests using
// a logged-in user's cookies, defeating CORS as a CSRF defense.
const isDev = process.env.NODE_ENV !== "production"
const isLocalhostOrigin = (origin) => isDev && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

const allowedOrigins = new Set(
    (process.env.CLIENT_ORIGIN || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
)

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        // no origin = same-origin requests, curl, server-to-server, etc.
        if (!origin || allowedOrigins.has(origin) || isLocalhostOrigin(origin)) {
            return callback(null, true)
        }

        callback(new Error("Not allowed by CORS"))
    },
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    const statusCode = err.statusCode || err.status || 500

    res.status(statusCode).json({
        message: err.message || "Something went wrong."
    })
})



module.exports = app
