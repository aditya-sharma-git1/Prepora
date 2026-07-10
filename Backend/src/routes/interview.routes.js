const express = require("express")
const rateLimit = require("express-rate-limit")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")
const { validate } = require("../middlewares/validate.middleware")
const { generateReportSchema, mockAnswerSchema, updateTaskSchema } = require("../validators/interview.validator")

const interviewRouter = express.Router()

// AI-calling routes are rate-limited since each request costs real money/quota
// against the Gemini API and can be abused to run up costs or exhaust quota.
const aiCallLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many AI requests. Please try again later." }
})



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, aiCallLimiter, upload.single("resume"), validate(generateReportSchema), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, aiCallLimiter, interviewController.generateResumePdfController)

/**
 * @route GET /api/interview/report/:interviewId/pdf
 * @description export the full interview report (questions, skill gaps, prep plan) as a PDF.
 * @access private
 */
interviewRouter.get("/report/:interviewId/pdf", authMiddleware.authUser, interviewController.generateInterviewReportPdfController)

/**
 * @route PATCH /api/interview/report/:interviewId/plan/:day/task/:taskIndex
 * @description mark a single preparation-plan task as completed/incomplete.
 * @access private
 */
interviewRouter.patch("/report/:interviewId/plan/:day/task/:taskIndex", authMiddleware.authUser, validate(updateTaskSchema), interviewController.updatePrepTaskController)

/**
 * @route POST /api/interview/report/:interviewId/mock-answer
 * @description submit a practice answer to a question and get AI feedback (mock interview mode).
 * @access private
 */
interviewRouter.post("/report/:interviewId/mock-answer", authMiddleware.authUser, aiCallLimiter, validate(mockAnswerSchema), interviewController.submitMockAnswerController)

/**
 * @route GET /api/interview/report/:interviewId/mock-answer
 * @description get all mock-interview answers/feedback for a report.
 * @access private
 */
interviewRouter.get("/report/:interviewId/mock-answer", authMiddleware.authUser, interviewController.getMockAnswersController)



module.exports = interviewRouter