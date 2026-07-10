const mongoose = require('mongoose');


const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Technical question is required" ]
    },
    intention: {
        type: String,
        required: [ true, "Intention is required" ]
    },
    answer: {
        type: String,
        required: [ true, "Answer is required" ]
    }
}, {
    _id: false
})

const resourceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [ "course", "article", "video", "practice", "book" ],
        required: [ true, "Resource type is required" ]
    },
    title: {
        type: String,
        required: [ true, "Resource title is required" ]
    },
    description: {
        type: String,
        required: [ true, "Resource description is required" ]
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [ true, "Skill is required" ]
    },
    severity: {
        type: String,
        enum: [ "low", "medium", "high" ],
        required: [ true, "Severity is required" ]
    },
    resource: resourceSchema
}, {
    _id: false
})

const taskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [ true, "Task text is required" ]
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [ true, "Day is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: [ taskSchema ]
})

const mockAnswerFeedbackSchema = new mongoose.Schema({
    score: {
        type: Number,
        min: 0,
        max: 100,
        required: [ true, "Feedback score is required" ]
    },
    strengths: [ { type: String } ],
    improvements: [ { type: String } ],
    summary: {
        type: String,
        required: [ true, "Feedback summary is required" ]
    }
}, {
    _id: false
})

const mockAnswerSchema = new mongoose.Schema({
    questionType: {
        type: String,
        enum: [ "technical", "behavioral" ],
        required: [ true, "Question type is required" ]
    },
    questionIndex: {
        type: Number,
        required: [ true, "Question index is required" ]
    },
    answerText: {
        type: String,
        required: [ true, "Answer text is required" ]
    },
    feedback: mockAnswerFeedbackSchema
}, {
    timestamps: true,
    _id: false
})

const matchedSkillSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    jdMentions: { type: Number, required: true }
}, { _id: false })

const customMatchSchema = new mongoose.Schema({
    score: { type: Number, min: 0, max: 100, required: true },
    skillCoverageScore: { type: Number, min: 0, max: 100, required: true },
    textSimilarityScore: { type: Number, min: 0, max: 100, required: true },
    matchedSkills: [ matchedSkillSchema ],
    missingSkills: [ matchedSkillSchema ]
}, { _id: false })

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [ true, "Job description is required" ]
    },
    resume: {
        type: String,
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    technicalQuestions: [ technicalQuestionSchema ],
    behavioralQuestions: [ behavioralQuestionSchema ],
    skillGaps: [ skillGapSchema ],
    preparationPlan: [ preparationPlanSchema ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        required: [ true, "Job title is required" ]
    },
    resumePdf: {
        // cached generated resume PDF (binary) so re-downloading doesn't re-run
        // the Gemini + Puppeteer pipeline every time
        type: Buffer
    },
    reportPdf: {
        // cached exported interview report PDF (binary, no AI call needed to regenerate,
        // but still avoids repeated Puppeteer rendering on every download)
        type: Buffer
    },
    mockAnswers: [ mockAnswerSchema ],
    customMatch: customMatchSchema
}, {
    timestamps: true
})


// speeds up getAllInterviewReportsController, which filters by user and sorts by createdAt
interviewReportSchema.index({ user: 1, createdAt: -1 })

const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;  