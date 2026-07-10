import { api } from "../../../lib/apiClient";


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)

    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}


/**
 * @description Service to mark a preparation-plan task as completed/incomplete.
 */
export const updatePrepTask = async ({ interviewId, day, taskIndex, completed }) => {
    const response = await api.patch(`/api/interview/report/${interviewId}/plan/${day}/task/${taskIndex}`, { completed })

    return response.data
}


/**
 * @description Service to submit a practice answer and get AI feedback (mock interview mode).
 */
export const submitMockAnswer = async ({ interviewId, questionType, questionIndex, answerText }) => {
    const response = await api.post(`/api/interview/report/${interviewId}/mock-answer`, {
        questionType,
        questionIndex,
        answerText
    })

    return response.data
}


/**
 * @description Service to get all mock-interview answers/feedback for a report.
 */
export const getMockAnswers = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}/mock-answer`)

    return response.data
}
