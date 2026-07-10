import React, { useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams } from 'react-router'
import UserBadge from '../../auth/components/UserBadge.jsx'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import LoadingScreen from '../../../components/LoadingScreen.jsx'
import Spinner from '../../../components/Spinner.jsx'



const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'skillgaps', label: 'Skill Gaps', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const AnswerFeedback = ({ feedback }) => {
    const scoreColor = feedback.score >= 80 ? '#2e7d32' : feedback.score >= 50 ? '#d68910' : '#c0392b'
    return (
        <div className='feedback-card'>
            <div className='feedback-card__header'>
                <span className='feedback-card__score' style={{ color: scoreColor }}>{feedback.score}/100</span>
                <p className='feedback-card__summary'>{feedback.summary}</p>
            </div>
            {feedback.strengths?.length > 0 && (
                <div className='feedback-card__section'>
                    <span className='q-card__tag q-card__tag--answer'>Strengths</span>
                    <ul>
                        {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
            {feedback.improvements?.length > 0 && (
                <div className='feedback-card__section'>
                    <span className='q-card__tag q-card__tag--intention'>Improve</span>
                    <ul>
                        {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
        </div>
    )
}

const QuestionCard = ({ item, index, questionType, interviewId, submitAnswer, isSubmittingAnswer, mockAnswer }) => {
    const [ open, setOpen ] = useState(false)
    const [ practiceMode, setPracticeMode ] = useState(false)
    const [ answerText, setAnswerText ] = useState(mockAnswer?.answerText || '')
    const submitting = isSubmittingAnswer(questionType, index)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!answerText.trim()) return
        await submitAnswer({ interviewId, questionType, questionIndex: index, answerText })
    }

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>

                    <button
                        type='button'
                        className='button secondary-button practice-toggle'
                        onClick={() => setPracticeMode((p) => !p)}
                    >
                        {practiceMode ? 'Hide Practice' : mockAnswer ? 'Retry This Question' : 'Practice This Question'}
                    </button>

                    {practiceMode && (
                        <form className='practice-form' onSubmit={handleSubmit}>
                            <textarea
                                className='practice-form__textarea'
                                placeholder='Type your answer as if you were in the interview...'
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                rows={5}
                            />
                            <button type='submit' className='button primary-button' disabled={submitting || !answerText.trim()}>
                                {submitting && <Spinner size='sm' />}
                                {submitting ? 'Getting feedback...' : 'Submit Answer'}
                            </button>
                        </form>
                    )}

                    {mockAnswer?.feedback && !submitting && (
                        <AnswerFeedback feedback={mockAnswer.feedback} />
                    )}
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day, onToggleTask, interviewId }) => {
    const total = day.tasks.length
    const completedCount = day.tasks.filter((t) => t.completed).length
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0

    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header'>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
                <span className='roadmap-day__progress-label'>{completedCount}/{total} done</span>
            </div>
            <div className='roadmap-day__progress-track'>
                <div className='roadmap-day__progress-fill' style={{ width: `${pct}%` }} />
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => (
                    <li key={i} className={task.completed ? 'roadmap-day__task--done' : ''}>
                        <label className='roadmap-day__checkbox'>
                            <input
                                type='checkbox'
                                checked={!!task.completed}
                                onChange={(e) => onToggleTask({ interviewId, day: day.day, taskIndex: i, completed: e.target.checked })}
                            />
                            {task.text}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const resourceTypeLabels = {
    course: 'Course',
    article: 'Article',
    video: 'Video',
    practice: 'Practice',
    book: 'Book'
}

const SkillGapCard = ({ gap }) => (
    <div className='q-card'>
        <div className='q-card__header'>
            <p className='q-card__question'>{gap.skill}</p>
            <span className={`skill-tag skill-tag--${gap.severity}`}>{gap.severity}</span>
        </div>
        {gap.resource && (
            <div className='q-card__body' style={{ display: 'block' }}>
                <div className='q-card__section'>
                    <span className='q-card__tag q-card__tag--intention'>{resourceTypeLabels[gap.resource.type] || gap.resource.type}</span>
                    <p><strong>{gap.resource.title}</strong></p>
                </div>
                <div className='q-card__section'>
                    <p>{gap.resource.description}</p>
                </div>
            </div>
        )}
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, loading, getResumePdf, downloadingResume, toggleTask, submitAnswer, isSubmittingAnswer, getMockAnswerFor } = useInterview()
    const { interviewId } = useParams()



    if (loading || !report) {
        return <LoadingScreen message='Loading your interview plan...' />
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'


    return (
        <div className='interview-page'>
            <ThemeToggle />
            <UserBadge />
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <div className='nav-brand'>
                            <span className='nav-brand__mark'>P</span>
                            <span>Prepora</span>
                        </div>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { getResumePdf(interviewId) }}
                        className='button primary-button'
                        disabled={downloadingResume}
                    >
                        {downloadingResume ? (
                            <Spinner size='sm' />
                        ) : (
                            <svg height={"0.8rem"} style={{ marginRight: "0.2rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        )}
                        {downloadingResume ? 'Generating...' : 'Download Resume'}
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard
                                        key={i}
                                        item={q}
                                        index={i}
                                        questionType='technical'
                                        interviewId={interviewId}
                                        submitAnswer={submitAnswer}
                                        isSubmittingAnswer={isSubmittingAnswer}
                                        mockAnswer={getMockAnswerFor('technical', i)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard
                                        key={i}
                                        item={q}
                                        index={i}
                                        questionType='behavioral'
                                        interviewId={interviewId}
                                        submitAnswer={submitAnswer}
                                        isSubmittingAnswer={isSubmittingAnswer}
                                        mockAnswer={getMockAnswerFor('behavioral', i)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>
                                    {report.preparationPlan.length}-day plan · {(() => {
                                        const allTasks = report.preparationPlan.flatMap(d => d.tasks)
                                        const done = allTasks.filter(t => t.completed).length
                                        const pct = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0
                                        return `${pct}% complete`
                                    })()}
                                </span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} onToggleTask={toggleTask} interviewId={interviewId} />
                                ))}
                            </div>
                        </section>
                    )}
                    {activeNav === 'skillgaps' && (
                        <section>
                            <div className='content-header'>
                                <h2>Skill Gaps &amp; Suggested Resources</h2>
                                <span className='content-header__count'>{report.skillGaps.length} gaps found</span>
                            </div>
                            <div className='q-list'>
                                {report.skillGaps.map((gap, i) => (
                                    <SkillGapCard key={i} gap={gap} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>AI Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    {report.customMatch && (
                        <div className='keyword-match' title={`Skill coverage: ${report.customMatch.skillCoverageScore}% · Text similarity: ${report.customMatch.textSimilarityScore}%`}>
                            <p className='keyword-match__label'>Keyword Match Score</p>
                            <p className='keyword-match__value'>{report.customMatch.score}<span>%</span></p>
                            <p className='keyword-match__sub'>
                                {report.customMatch.matchedSkills.length} of {report.customMatch.matchedSkills.length + report.customMatch.missingSkills.length} required skills found
                            </p>
                        </div>
                    )}

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span
                                    key={i}
                                    className={`skill-tag skill-tag--${gap.severity}`}
                                    title={gap.resource ? `${resourceTypeLabels[gap.resource.type] || gap.resource.type}: ${gap.resource.title}` : undefined}
                                >
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview
