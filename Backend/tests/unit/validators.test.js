const { registerSchema, loginSchema } = require("../../src/validators/auth.validator")
const { generateReportSchema, mockAnswerSchema, updateTaskSchema } = require("../../src/validators/interview.validator")

describe("auth.validator.registerSchema", () => {
    test("accepts valid input", () => {
        const result = registerSchema.safeParse({ username: "adityasharma", email: "test@example.com", password: "password123" })
        expect(result.success).toBe(true)
    })

    test("rejects short username", () => {
        const result = registerSchema.safeParse({ username: "ab", email: "test@example.com", password: "password123" })
        expect(result.success).toBe(false)
    })

    test("rejects invalid email", () => {
        const result = registerSchema.safeParse({ username: "adityasharma", email: "not-an-email", password: "password123" })
        expect(result.success).toBe(false)
    })

    test("rejects short password", () => {
        const result = registerSchema.safeParse({ username: "adityasharma", email: "test@example.com", password: "123" })
        expect(result.success).toBe(false)
    })

    test("lowercases and trims email", () => {
        const result = registerSchema.safeParse({ username: "adityasharma", email: "  Test@Example.com  ", password: "password123" })
        expect(result.success).toBe(true)
        expect(result.data.email).toBe("test@example.com")
    })
})

describe("auth.validator.loginSchema", () => {
    test("accepts valid input", () => {
        const result = loginSchema.safeParse({ email: "test@example.com", password: "anything" })
        expect(result.success).toBe(true)
    })

    test("rejects missing password", () => {
        const result = loginSchema.safeParse({ email: "test@example.com" })
        expect(result.success).toBe(false)
    })

    test("rejects invalid email format", () => {
        const result = loginSchema.safeParse({ email: "nope", password: "x" })
        expect(result.success).toBe(false)
    })
})

describe("interview.validator.generateReportSchema", () => {
    test("accepts valid input", () => {
        const result = generateReportSchema.safeParse({ jobDescription: "We need a backend engineer with Node.js experience." })
        expect(result.success).toBe(true)
    })

    test("rejects too-short job description", () => {
        const result = generateReportSchema.safeParse({ jobDescription: "short" })
        expect(result.success).toBe(false)
    })

    test("selfDescription is optional", () => {
        const result = generateReportSchema.safeParse({ jobDescription: "We need a backend engineer with Node.js experience." })
        expect(result.success).toBe(true)
        expect(result.data.selfDescription).toBeUndefined()
    })
})

describe("interview.validator.mockAnswerSchema", () => {
    test("accepts valid technical answer", () => {
        const result = mockAnswerSchema.safeParse({ questionType: "technical", questionIndex: 0, answerText: "My answer" })
        expect(result.success).toBe(true)
    })

    test("rejects invalid questionType", () => {
        const result = mockAnswerSchema.safeParse({ questionType: "invalid", questionIndex: 0, answerText: "My answer" })
        expect(result.success).toBe(false)
    })

    test("rejects negative questionIndex", () => {
        const result = mockAnswerSchema.safeParse({ questionType: "technical", questionIndex: -1, answerText: "My answer" })
        expect(result.success).toBe(false)
    })

    test("rejects empty answerText", () => {
        const result = mockAnswerSchema.safeParse({ questionType: "technical", questionIndex: 0, answerText: "" })
        expect(result.success).toBe(false)
    })
})

describe("interview.validator.updateTaskSchema", () => {
    test("accepts boolean completed", () => {
        expect(updateTaskSchema.safeParse({ completed: true }).success).toBe(true)
        expect(updateTaskSchema.safeParse({ completed: false }).success).toBe(true)
    })

    test("rejects non-boolean completed", () => {
        expect(updateTaskSchema.safeParse({ completed: "yes" }).success).toBe(false)
        expect(updateTaskSchema.safeParse({}).success).toBe(false)
    })
})
