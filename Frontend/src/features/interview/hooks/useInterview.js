import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, updatePrepTask, submitMockAnswer } from "../services/interview.api"
import { useCallback, useContext, useEffect, useState } from "react"
import { InterviewContext } from "../interview.context-value"
import { useParams } from "react-router"
import { useToast } from "../../../components/Toast/useToast"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const { showToast } = useToast()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            const message = error.response?.data?.message || error.message || "Failed to generate interview report."
            setError(message)
            showToast(message, 'error')
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        setError("")
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            const message = error.response?.data?.message || error.message || "Failed to load interview report."
            setError(message)
            showToast(message, 'error')
            return null
        } finally {
            setLoading(false)
        }
    }, [ setError, setLoading, setReport, showToast ])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            console.log(error)
            const message = error.response?.data?.message || error.message || "Failed to load interview reports."
            setError(message)
            showToast(message, 'error')
            return []
        } finally {
            setLoading(false)
        }
    }, [ setError, setLoading, setReports, showToast ])

    const [ downloadingResume, setDownloadingResume ] = useState(false)

    const getResumePdf = async (interviewReportId) => {
        setDownloadingResume(true)
        setError("")
        let url = null
        let link = null
        try {
            const response = await generateResumePdf({ interviewReportId })
            url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
            // when responseType is 'blob', axios delivers error responses as a Blob too
            // (not parsed JSON), so error.response.data.message is normally undefined here.
            // Read the blob's text and parse it ourselves to recover the real backend message.
            let message = "Failed to download resume PDF."
            const errorBlob = error.response?.data
            if (errorBlob instanceof Blob) {
                try {
                    const text = await errorBlob.text()
                    const parsed = JSON.parse(text)
                    message = parsed.message || message
                } catch {
                    // response wasn't JSON either - fall back to the generic message
                }
            } else {
                message = error.response?.data?.message || error.message || message
            }
            setError(message)
            showToast(message, 'error')
        } finally {
            if (link) link.remove()
            if (url) window.URL.revokeObjectURL(url)
            setDownloadingResume(false)
        }
    }

    const toggleTask = async ({ interviewId, day, taskIndex, completed }) => {
        // optimistic update: flip the UI immediately, roll back if the request fails
        const previousReport = report

        setReport((current) => {
            if (!current) return current
            return {
                ...current,
                preparationPlan: current.preparationPlan.map((d) =>
                    d.day === day
                        ? { ...d, tasks: d.tasks.map((t, i) => i === taskIndex ? { ...t, completed } : t) }
                        : d
                )
            }
        })

        try {
            await updatePrepTask({ interviewId, day, taskIndex, completed })
        } catch (error) {
            console.log(error)
            const message = error.response?.data?.message || error.message || "Failed to update task."
            setError(message)
            showToast(message, 'error')
            setReport(previousReport)
        }
    }

    const [ submittingAnswers, setSubmittingAnswers ] = useState({})

    const answerKey = (questionType, questionIndex) => `${questionType}-${questionIndex}`

    const submitAnswer = async ({ interviewId, questionType, questionIndex, answerText }) => {
        const key = answerKey(questionType, questionIndex)
        setSubmittingAnswers((current) => ({ ...current, [ key ]: true }))
        setError("")

        try {
            const response = await submitMockAnswer({ interviewId, questionType, questionIndex, answerText })
            setReport((current) => current ? { ...current, mockAnswers: response.mockAnswers } : current)
            return response.feedback
        } catch (error) {
            console.log(error)
            const message = error.response?.data?.message || error.message || "Failed to get feedback on your answer."
            setError(message)
            showToast(message, 'error')
            return null
        } finally {
            setSubmittingAnswers((current) => {
                const next = { ...current }
                delete next[ key ]
                return next
            })
        }
    }

    const isSubmittingAnswer = (questionType, questionIndex) => !!submittingAnswers[ answerKey(questionType, questionIndex) ]

    const getMockAnswerFor = (questionType, questionIndex) =>
        report?.mockAnswers?.find((a) => a.questionType === questionType && a.questionIndex === questionIndex) || null

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ getReportById, getReports, interviewId ])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf, downloadingResume, toggleTask, submitAnswer, isSubmittingAnswer, getMockAnswerFor }

}
