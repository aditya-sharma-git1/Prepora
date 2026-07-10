const { z } = require("zod")

const generateReportSchema = z.object({
    jobDescription: z.string().trim().min(10, "Job description must be at least 10 characters"),
    selfDescription: z.string().trim().optional()
})

const mockAnswerSchema = z.object({
    questionType: z.enum([ "technical", "behavioral" ], {
        errorMap: () => ({ message: "questionType must be 'technical' or 'behavioral'" })
    }),
    questionIndex: z.number().int().min(0, "questionIndex must be a non-negative integer"),
    answerText: z.string().trim().min(1, "answerText is required")
})

const updateTaskSchema = z.object({
    completed: z.boolean({ required_error: "completed (boolean) is required" })
})

module.exports = { generateReportSchema, mockAnswerSchema, updateTaskSchema }
