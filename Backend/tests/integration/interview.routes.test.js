const request = require("supertest")
const jwt = require("jsonwebtoken")

jest.mock("../../src/models/interviewReport.model")
jest.mock("../../src/models/blacklist.model")
jest.mock("../../src/services/ai.service")

const interviewReportModel = require("../../src/models/interviewReport.model")
const blacklistModel = require("../../src/models/blacklist.model")
const aiService = require("../../src/services/ai.service")
const app = require("../../src/app")

const authToken = jwt.sign({ id: "user-123", username: "adityasharma" }, process.env.JWT_SECRET)
const authCookie = [ `token=${authToken}` ]

beforeEach(() => {
    blacklistModel.findOne.mockResolvedValue(null) // token is never blacklisted in these tests
})

describe("auth requirement", () => {
    test("rejects unauthenticated requests to protected routes", async () => {
        const res = await request(app).get("/api/interview/")
        expect(res.status).toBe(401)
    })
})

describe("POST /api/interview/ (generate report)", () => {
    test("rejects request without a job description (validation)", async () => {
        const res = await request(app)
            .post("/api/interview/")
            .set("Cookie", authCookie)
            .field("selfDescription", "some description")

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Validation failed.")
    })

    test("generates a report successfully with valid input", async () => {
        aiService.generateInterviewReport.mockResolvedValue({
            title: "Backend Engineer",
            matchScore: 80,
            technicalQuestions: [],
            behavioralQuestions: [],
            skillGaps: [],
            preparationPlan: [
                { day: 1, focus: "DS", tasks: [ "Arrays", "Linked Lists" ] }
            ]
        })

        interviewReportModel.create.mockImplementation(async (data) => ({ _id: "report-1", ...data }))

        const res = await request(app)
            .post("/api/interview/")
            .set("Cookie", authCookie)
            .field("jobDescription", "We need a backend engineer with Node.js and MongoDB experience.")
            .field("selfDescription", "I have 2 years experience with Node.js and MongoDB")

        expect(res.status).toBe(201)
        expect(aiService.generateInterviewReport).toHaveBeenCalledTimes(1)
        expect(interviewReportModel.create).toHaveBeenCalledTimes(1)

        // verify the controller transformed string tasks into {text, completed} objects
        const createCallArg = interviewReportModel.create.mock.calls[ 0 ][ 0 ]
        expect(createCallArg.preparationPlan[ 0 ].tasks[ 0 ]).toEqual({ text: "Arrays", completed: false })

        // verify the custom match score was computed and attached (not from the AI)
        expect(createCallArg.customMatch).toBeDefined()
        expect(typeof createCallArg.customMatch.score).toBe("number")
    })
})

describe("GET /api/interview/report/:interviewId", () => {
    test("returns 404 when report is not found", async () => {
        interviewReportModel.findOne.mockResolvedValue(null)

        const res = await request(app)
            .get("/api/interview/report/nonexistent-id")
            .set("Cookie", authCookie)

        expect(res.status).toBe(404)
    })

    test("returns the report when found", async () => {
        interviewReportModel.findOne.mockResolvedValue({ _id: "report-1", title: "Backend Engineer" })

        const res = await request(app)
            .get("/api/interview/report/report-1")
            .set("Cookie", authCookie)

        expect(res.status).toBe(200)
        expect(res.body.interviewReport.title).toBe("Backend Engineer")
    })
})

describe("GET /api/interview/ (list reports)", () => {
    test("returns the user's reports", async () => {
        const mockChain = {
            sort: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([ { _id: "r1" }, { _id: "r2" } ])
        }
        interviewReportModel.find.mockReturnValue(mockChain)

        const res = await request(app)
            .get("/api/interview/")
            .set("Cookie", authCookie)

        expect(res.status).toBe(200)
        expect(res.body.interviewReports).toHaveLength(2)
        expect(interviewReportModel.find).toHaveBeenCalledWith({ user: "user-123" })
    })
})

describe("PATCH /api/interview/report/:interviewId/plan/:day/task/:taskIndex", () => {
    test("rejects request with non-boolean completed (validation)", async () => {
        const res = await request(app)
            .patch("/api/interview/report/report-1/plan/1/task/0")
            .set("Cookie", authCookie)
            .send({ completed: "yes" })

        expect(res.status).toBe(400)
    })

    test("returns 404 when report is not found", async () => {
        interviewReportModel.findOne.mockResolvedValue(null)

        const res = await request(app)
            .patch("/api/interview/report/report-1/plan/1/task/0")
            .set("Cookie", authCookie)
            .send({ completed: true })

        expect(res.status).toBe(404)
    })

    test("returns 404 when the task index doesn't exist", async () => {
        interviewReportModel.findOne.mockResolvedValue({
            preparationPlan: [ { day: 1, tasks: [ { text: "Arrays", completed: false } ] } ],
            save: jest.fn().mockResolvedValue(true)
        })

        const res = await request(app)
            .patch("/api/interview/report/report-1/plan/1/task/5") // out of range
            .set("Cookie", authCookie)
            .send({ completed: true })

        expect(res.status).toBe(404)
    })

    test("marks a task as completed successfully", async () => {
        const task = { text: "Arrays", completed: false }
        const mockReport = {
            preparationPlan: [ { day: 1, tasks: [ task ] } ],
            save: jest.fn().mockResolvedValue(true)
        }
        interviewReportModel.findOne.mockResolvedValue(mockReport)

        const res = await request(app)
            .patch("/api/interview/report/report-1/plan/1/task/0")
            .set("Cookie", authCookie)
            .send({ completed: true })

        expect(res.status).toBe(200)
        expect(task.completed).toBe(true)
        expect(mockReport.save).toHaveBeenCalledTimes(1)
    })
})

describe("POST /api/interview/report/:interviewId/mock-answer", () => {
    test("rejects invalid questionType (validation)", async () => {
        const res = await request(app)
            .post("/api/interview/report/report-1/mock-answer")
            .set("Cookie", authCookie)
            .send({ questionType: "invalid", questionIndex: 0, answerText: "my answer" })

        expect(res.status).toBe(400)
    })

    test("returns 404 when the question doesn't exist", async () => {
        interviewReportModel.findOne.mockResolvedValue({
            technicalQuestions: [],
            mockAnswers: []
        })

        const res = await request(app)
            .post("/api/interview/report/report-1/mock-answer")
            .set("Cookie", authCookie)
            .send({ questionType: "technical", questionIndex: 0, answerText: "my answer" })

        expect(res.status).toBe(404)
    })

    test("submits an answer and returns AI feedback successfully", async () => {
        const mockReport = {
            technicalQuestions: [ { question: "Explain event loop", intention: "test", answer: "model answer" } ],
            mockAnswers: [],
            save: jest.fn().mockResolvedValue(true)
        }
        interviewReportModel.findOne.mockResolvedValue(mockReport)

        aiService.generateAnswerFeedback.mockResolvedValue({
            score: 80,
            strengths: [ "Clear" ],
            improvements: [ "Add an example" ],
            summary: "Good answer overall."
        })

        const res = await request(app)
            .post("/api/interview/report/report-1/mock-answer")
            .set("Cookie", authCookie)
            .send({ questionType: "technical", questionIndex: 0, answerText: "The event loop lets Node handle async work." })

        expect(res.status).toBe(200)
        expect(res.body.feedback.score).toBe(80)
        expect(mockReport.mockAnswers).toHaveLength(1)
        expect(mockReport.save).toHaveBeenCalledTimes(1)
    })

    test("replaces a previous attempt on the same question instead of duplicating", async () => {
        const mockReport = {
            technicalQuestions: [ { question: "Explain event loop", intention: "test", answer: "model answer" } ],
            mockAnswers: [
                { questionType: "technical", questionIndex: 0, answerText: "old answer", feedback: { score: 40, strengths: [], improvements: [], summary: "old" } }
            ],
            save: jest.fn().mockResolvedValue(true)
        }
        interviewReportModel.findOne.mockResolvedValue(mockReport)

        aiService.generateAnswerFeedback.mockResolvedValue({
            score: 90,
            strengths: [ "Much better" ],
            improvements: [],
            summary: "Great improvement."
        })

        const res = await request(app)
            .post("/api/interview/report/report-1/mock-answer")
            .set("Cookie", authCookie)
            .send({ questionType: "technical", questionIndex: 0, answerText: "new improved answer" })

        expect(res.status).toBe(200)
        expect(mockReport.mockAnswers).toHaveLength(1) // still 1, not 2
        expect(mockReport.mockAnswers[ 0 ].answerText).toBe("new improved answer")
        expect(mockReport.mockAnswers[ 0 ].feedback.score).toBe(90)
    })
})

describe("POST /api/interview/resume/pdf/:interviewReportId", () => {
    test("scopes the lookup to the logged-in user (not just any report by id)", async () => {
        interviewReportModel.findOne.mockResolvedValue({
            resumePdf: Buffer.from("cached-pdf-bytes"),
            save: jest.fn()
        })

        await request(app)
            .post("/api/interview/resume/pdf/report-1")
            .set("Cookie", authCookie)

        // must filter by both _id AND the authenticated user - a plain findById()
        // would let any logged-in user download any other user's resume by guessing the id
        expect(interviewReportModel.findOne).toHaveBeenCalledWith({ _id: "report-1", user: "user-123" })
    })

    test("returns 404 when the report doesn't exist or doesn't belong to this user", async () => {
        interviewReportModel.findOne.mockResolvedValue(null)

        const res = await request(app)
            .post("/api/interview/resume/pdf/report-1")
            .set("Cookie", authCookie)

        expect(res.status).toBe(404)
    })

    test("serves the cached PDF directly without regenerating", async () => {
        const cachedPdf = Buffer.from("already-generated-pdf")
        const mockReport = { resumePdf: cachedPdf, save: jest.fn() }
        interviewReportModel.findOne.mockResolvedValue(mockReport)

        const res = await request(app)
            .post("/api/interview/resume/pdf/report-1")
            .set("Cookie", authCookie)

        expect(res.status).toBe(200)
        expect(res.headers[ "content-type" ]).toMatch(/application\/pdf/)
        expect(aiService.generateResumePdf).not.toHaveBeenCalled()
        expect(mockReport.save).not.toHaveBeenCalled() // no need to save, nothing changed
    })

    test("generates and caches a new PDF when none exists yet", async () => {
        const mockReport = {
            resumePdf: null,
            resume: "resume text",
            jobDescription: "jd text",
            selfDescription: "self desc",
            save: jest.fn().mockResolvedValue(true)
        }
        interviewReportModel.findOne.mockResolvedValue(mockReport)
        aiService.generateResumePdf.mockResolvedValue(Buffer.from("freshly-generated-pdf"))

        const res = await request(app)
            .post("/api/interview/resume/pdf/report-1")
            .set("Cookie", authCookie)

        expect(res.status).toBe(200)
        expect(aiService.generateResumePdf).toHaveBeenCalledWith({
            resume: "resume text",
            jobDescription: "jd text",
            selfDescription: "self desc"
        })
        expect(mockReport.resumePdf).toBeInstanceOf(Buffer)
        expect(mockReport.save).toHaveBeenCalledTimes(1)
    })

    test("propagates a clean error message (e.g. rate limit) as JSON, not a raw crash", async () => {
        const mockReport = { resumePdf: null, resume: "r", jobDescription: "j", selfDescription: "s", save: jest.fn() }
        interviewReportModel.findOne.mockResolvedValue(mockReport)
        aiService.generateResumePdf.mockRejectedValue(new Error("The AI service has hit its request limit for now. Please wait a few minutes and try again."))

        const res = await request(app)
            .post("/api/interview/resume/pdf/report-1")
            .set("Cookie", authCookie)

        expect(res.status).toBe(500)
        expect(res.body.message).toMatch(/request limit/i)
    })
})
