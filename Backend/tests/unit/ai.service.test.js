// Puppeteer's page.pdf() returns a plain Uint8Array in current versions, not a Node
// Buffer. This mock intentionally mirrors that real behavior (rather than generously
// returning a Buffer like earlier ad-hoc test scripts did) so this suite would have
// caught the "Cast to Buffer failed" bug that shipped without any test coverage.
jest.mock("puppeteer", () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setContent: jest.fn().mockResolvedValue(undefined),
            pdf: jest.fn().mockResolvedValue(new Uint8Array([ 37, 80, 68, 70, 45, 49, 46, 52 ])), // "%PDF-1.4" bytes
            close: jest.fn().mockResolvedValue(undefined)
        }),
        close: jest.fn().mockResolvedValue(undefined)
    })
}))

jest.mock("@google/genai", () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent: jest.fn() } }))
}))

const { generatePdfFromHtml } = require("../../src/services/ai.service")
const interviewReportModel = require("../../src/models/interviewReport.model")
const mongoose = require("mongoose")

describe("generatePdfFromHtml", () => {
    test("returns a real Node.js Buffer, not a plain Uint8Array", async () => {
        const result = await generatePdfFromHtml("<html><body>test</body></html>")

        expect(Buffer.isBuffer(result)).toBe(true)
    })

    test("the returned Buffer is accepted by the InterviewReport schema (resumePdf/reportPdf)", async () => {
        const pdfBuffer = await generatePdfFromHtml("<html><body>test</body></html>")

        const doc = new interviewReportModel({
            jobDescription: "jd",
            title: "Backend Engineer",
            user: new mongoose.Types.ObjectId(),
            resumePdf: pdfBuffer,
            reportPdf: pdfBuffer
        })

        const err = doc.validateSync()
        expect(err).toBeUndefined()
    })

    test("preserves the actual PDF bytes through the conversion", async () => {
        const result = await generatePdfFromHtml("<html><body>test</body></html>")

        expect(Array.from(result)).toEqual([ 37, 80, 68, 70, 45, 49, 46, 52 ])
    })
})
