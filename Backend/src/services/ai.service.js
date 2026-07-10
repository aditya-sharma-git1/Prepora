const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

// ---- Puppeteer: reuse a single browser instance instead of launching one per request ----
// Launching Chromium takes 1-3s+ on its own; doing that on every PDF request was the
// single biggest source of slowness. We launch once, lazily, and reuse it.
let browserPromise = null

function getBrowser() {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            args: [ "--no-sandbox", "--disable-setuid-sandbox" ]
        }).catch((err) => {
            // if launch failed, allow a future call to retry instead of caching the rejection forever
            browserPromise = null
            throw err
        })
    }
    return browserPromise
}

// close the shared browser on process shutdown so it doesn't linger
async function closeBrowser() {
    if (browserPromise) {
        const browser = await browserPromise.catch(() => null)
        if (browser) await browser.close().catch(() => {})
        browserPromise = null
    }
}

process.on("SIGINT", closeBrowser)
process.on("SIGTERM", closeBrowser)

// ---- Timeout helper so a slow/hanging Gemini call doesn't hang the whole request ----
// 60s by default (not 30s) - generous enough to tolerate a cold-started free-tier
// deployment (e.g. Render free plan spinning back up) plus genuine preview-model
// latency. Override with AI_CALL_TIMEOUT_MS in .env if you need something different.
const AI_CALL_TIMEOUT_MS = Number(process.env.AI_CALL_TIMEOUT_MS) || 60_000

// Gemini errors sometimes come through as a raw JSON string in error.message
// (e.g. `{"error":{"code":429,"message":"...","status":"RESOURCE_EXHAUSTED"}}`).
// Detect rate-limit/quota errors specifically and turn them into a clean,
// user-facing message instead of surfacing that raw JSON blob to the frontend.
function friendlyAiError(error) {
    const raw = error?.message || ""

    if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("\"code\":429") || error?.status === 429) {
        return new Error("The AI service has hit its request limit for now. Please wait a few minutes and try again.")
    }

    return error
}

function withTimeout(promise, ms, label) {
    let timer

    // Promise.race doesn't cancel the losing side - the real Gemini call keeps
    // running in the background even after we give up and report a timeout.
    // If it eventually resolves or (more usefully) rejects, log the real reason
    // so a hanging call isn't a total black box - e.g. an auth error, invalid
    // model name, or network failure that took longer than our timeout to surface.
    promise.then(
        () => console.log(`[ai.service] ${label} eventually completed after the timeout had already fired.`),
        (err) => console.log(`[ai.service] ${label} eventually failed after the timeout had already fired. Real error: ${err.message}`)
    )

    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    })
    return Promise.race([ promise, timeout ]).finally(() => clearTimeout(timer))
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances"),
        resource: z.object({
            type: z.enum([ "course", "article", "video", "practice", "book" ]).describe("The type of resource being suggested"),
            title: z.string().describe("A specific, concrete title of a resource to learn this skill, e.g. an actual well-known course, book, or practice platform name — not a generic placeholder"),
            description: z.string().describe("A short 1-2 sentence explanation of why this resource helps close this specific skill gap")
        }).describe("A concrete resource suggestion to help the candidate close this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    let response
    try {
        response = await withTimeout(
            ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(interviewReportSchema),
                }
            }),
            AI_CALL_TIMEOUT_MS,
            "generateInterviewReport"
        )
    } catch (error) {
        throw friendlyAiError(error)
    }

    return JSON.parse(response.text)


}



const answerFeedbackSchema = z.object({
    score: z.number().describe("A score between 0 and 100 rating the quality of the candidate's answer, considering clarity, completeness, structure, and relevance to what the interviewer was really asking"),
    strengths: z.array(z.string()).describe("Specific things the candidate did well in their answer"),
    improvements: z.array(z.string()).describe("Specific, actionable ways the candidate could improve their answer"),
    summary: z.string().describe("A short 1-2 sentence overall summary of the feedback, written directly to the candidate in an encouraging but honest tone")
})

async function generateAnswerFeedback({ question, intention, modelAnswer, userAnswer, questionType }) {

    const prompt = `You are an experienced interviewer giving feedback on a candidate's practice answer to a ${questionType} interview question.

Question: ${question}
What the interviewer is really trying to assess (intention): ${intention}
A strong model answer approach: ${modelAnswer}

Candidate's actual answer:
"""
${userAnswer}
"""

Evaluate the candidate's answer against the intention and the model answer approach. Be specific and constructive - reference details from their actual answer rather than generic advice.`

    let response
    try {
        response = await withTimeout(
            ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(answerFeedbackSchema),
                }
            }),
            AI_CALL_TIMEOUT_MS,
            "generateAnswerFeedback"
        )
    } catch (error) {
        throw friendlyAiError(error)
    }

    return JSON.parse(response.text)
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await getBrowser()
    const page = await browser.newPage()

    try {
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        // Puppeteer returns a plain Uint8Array (not a Node Buffer) in current versions.
        // A Buffer technically extends Uint8Array, but the reverse isn't true - Mongoose's
        // Buffer schema cast (and other Buffer-specific consumers) don't recognize a raw
        // Uint8Array as a valid Buffer, so we explicitly convert it here at the source.
        return Buffer.from(pdfBuffer)
    } finally {
        await page.close().catch(() => {})
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    let response
    try {
        response = await withTimeout(
            ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: zodToJsonSchema(resumePdfSchema),
                }
            }),
            AI_CALL_TIMEOUT_MS,
            "generateResumePdf"
        )
    } catch (error) {
        throw friendlyAiError(error)
    }


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf, generatePdfFromHtml, generateAnswerFeedback }