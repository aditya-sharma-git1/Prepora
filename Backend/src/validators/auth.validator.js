const { z } = require("zod")

const registerSchema = z.object({
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters"),
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
})

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    password: z.string().min(1, "Password is required")
})

module.exports = { registerSchema, loginSchema }
