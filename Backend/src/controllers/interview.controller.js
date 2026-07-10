const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const { generateInterviewReport, generateResumePdf, generatePdfFromHtml, generateAnswerFeedback } = require("../services/ai.service")
const { computeMatchAnalysis } = require("../utils/matchScorer")
const { buildInterviewReportHtml } = require("../utils/reportPdfTemplate")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    const { selfDescription, jobDescription } = req.body
    let resume = ""

    if (!jobDescription) {
        return res.status(400).json({
            message: "Job description is required."
        })
    }

    if (req.file) {
        if (req.file.mimetype === "application/pdf") {
            const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
            resume = resumeContent.text
        } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const resumeContent = await mammoth.extractRawText({ buffer: req.file.buffer })
            resume = resumeContent.value
        }
    }

    if (!resume && !selfDescription) {
        return res.status(400).json({
            message: "Please provide either a PDF resume or a self description."
        })
    }

    const interViewReportByAi = await generateInterviewReport({
        resume,
        selfDescription,
        jobDescription
    })

    // deterministic, explainable second opinion on match score - computed locally,
    // not via the AI, using skill-dictionary coverage + term-frequency cosine similarity
    const customMatch = computeMatchAnalysis({ resume, jobDescription, selfDescription })

    // the AI returns preparationPlan.tasks as plain strings; convert them into
    // { text, completed } objects so progress can be tracked per task
    if (Array.isArray(interViewReportByAi.preparationPlan)) {
        interViewReportByAi.preparationPlan = interViewReportByAi.preparationPlan.map((day) => ({
            ...day,
            tasks: (day.tasks || []).map((task) => ({ text: task, completed: false }))
        }))
    }

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume,
        selfDescription,
        jobDescription,
        ...interViewReportByAi,
        customMatch
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    // serve the cached PDF if we've already generated one for this report,
    // instead of re-running the Gemini + Puppeteer pipeline every download
    let pdfBuffer = interviewReport.resumePdf

    if (!pdfBuffer) {
        pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })
        interviewReport.resumePdf = pdfBuffer
        await interviewReport.save()
    }

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

/**
 * @description Controller to export the full interview report (questions, skill gaps,
 * preparation plan) as a downloadable PDF. Caches the generated PDF on the report
 * so repeat downloads are instant.
 */
async function generateInterviewReportPdfController(req, res) {
    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    let pdfBuffer = interviewReport.reportPdf

    if (!pdfBuffer) {
        const html = buildInterviewReportHtml(interviewReport)
        pdfBuffer = await generatePdfFromHtml(html)
        interviewReport.reportPdf = pdfBuffer
        await interviewReport.save()
    }

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=interview_report_${interviewId}.pdf`
    })

    res.send(pdfBuffer)
}

/**
 * @description Controller to toggle (or explicitly set) the completed status of a single
 * task within a specific day of the preparation plan.
 */
async function updatePrepTaskController(req, res) {
    const { interviewId, day, taskIndex } = req.params
    const { completed } = req.body

    const dayNum = Number(day)
    const taskIdx = Number(taskIndex)

    if (!Number.isInteger(dayNum) || !Number.isInteger(taskIdx) || taskIdx < 0) {
        return res.status(400).json({
            message: "Invalid day or task index."
        })
    }

    if (typeof completed !== "boolean") {
        return res.status(400).json({
            message: "completed (boolean) is required in the request body."
        })
    }

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const dayPlan = interviewReport.preparationPlan.find((d) => d.day === dayNum)

    if (!dayPlan || !dayPlan.tasks || !dayPlan.tasks[taskIdx]) {
        return res.status(404).json({
            message: "Task not found in preparation plan."
        })
    }

    dayPlan.tasks[taskIdx].completed = completed

    // any change to the plan invalidates the previously cached report PDF
    interviewReport.reportPdf = undefined

    await interviewReport.save()

    res.status(200).json({
        message: "Task updated successfully.",
        preparationPlan: interviewReport.preparationPlan
    })
}

/**
 * @description Controller to submit a practice answer to a technical/behavioral question
 * and get AI-generated feedback on it (mock interview mode). Re-submitting an answer for
 * the same question replaces the previous attempt.
 */
async function submitMockAnswerController(req, res) {
    const { interviewId } = req.params
    const { questionType, questionIndex, answerText } = req.body

    if (![ "technical", "behavioral" ].includes(questionType)) {
        return res.status(400).json({
            message: "questionType must be 'technical' or 'behavioral'."
        })
    }

    const qIndex = Number(questionIndex)

    if (!Number.isInteger(qIndex) || qIndex < 0) {
        return res.status(400).json({
            message: "questionIndex must be a valid non-negative integer."
        })
    }

    if (!answerText || !answerText.trim()) {
        return res.status(400).json({
            message: "answerText is required."
        })
    }

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const questionList = questionType === "technical" ? interviewReport.technicalQuestions : interviewReport.behavioralQuestions
    const targetQuestion = questionList[ qIndex ]

    if (!targetQuestion) {
        return res.status(404).json({
            message: "Question not found for the given questionType and questionIndex."
        })
    }

    const feedback = await generateAnswerFeedback({
        question: targetQuestion.question,
        intention: targetQuestion.intention,
        modelAnswer: targetQuestion.answer,
        userAnswer: answerText,
        questionType
    })

    // replace any existing attempt for this exact question, otherwise add a new one
    const existingIndex = interviewReport.mockAnswers.findIndex(
        (a) => a.questionType === questionType && a.questionIndex === qIndex
    )

    const mockAnswerEntry = { questionType, questionIndex: qIndex, answerText, feedback }

    if (existingIndex >= 0) {
        interviewReport.mockAnswers[ existingIndex ] = mockAnswerEntry
    } else {
        interviewReport.mockAnswers.push(mockAnswerEntry)
    }

    await interviewReport.save()

    res.status(200).json({
        message: "Feedback generated successfully.",
        feedback,
        mockAnswers: interviewReport.mockAnswers
    })
}

/**
 * @description Controller to fetch all mock-interview answers/feedback for a report.
 */
async function getMockAnswersController(req, res) {
    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id }).select("mockAnswers")

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Mock answers fetched successfully.",
        mockAnswers: interviewReport.mockAnswers
    })
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController, generateInterviewReportPdfController, updatePrepTaskController, submitMockAnswerController, getMockAnswersController }
