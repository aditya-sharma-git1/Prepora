import React from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import '../style/landing.scss'

const icon = (path) => (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {path}
    </svg>
)

const TargetIcon = icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>)
const ChatIcon = icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />)
const BookIcon = icon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>)
const MapIcon = icon(<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></>)
const FileIcon = icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>)
const LockIcon = icon(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>)
const SparkleIcon = icon(<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" />)
const ScaleIcon = icon(<><path d="M12 3v18" /><path d="M5 8l-3 6a4 4 0 0 0 6 0z" /><path d="M19 8l-3 6a4 4 0 0 0 6 0z" /><path d="M5 8h14" /><path d="M9 3h6" /></>)
const RepeatIcon = icon(<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>)

const FEATURES = [
    {
        Icon: TargetIcon,
        title: 'Dual Match Scoring',
        description: 'An AI-generated match score, plus a fully transparent, independently-computed keyword match score — so you know exactly why you scored what you did, not just a number to trust blindly.'
    },
    {
        Icon: ChatIcon,
        title: 'Mock Interview Practice',
        description: 'Answer real technical and behavioral questions and get instant AI feedback — strengths, gaps, and a score, just like a real interviewer would give.'
    },
    {
        Icon: BookIcon,
        title: 'Skill Gap → Resources',
        description: 'Every skill gap comes with a concrete, specific resource to close it — a course, article, or practice platform, not generic advice.'
    },
    {
        Icon: MapIcon,
        title: 'Personalized Roadmap',
        description: 'A day-wise preparation plan with trackable tasks, so you always know exactly what to focus on next — and can see your progress build.'
    },
    {
        Icon: FileIcon,
        title: 'Tailored Resume + Report PDFs',
        description: 'Download a resume tailored to the job description, and your full interview report, ready to share or print.'
    },
    {
        Icon: LockIcon,
        title: 'Private & Secure',
        description: 'Your resume and reports are tied to your account only, protected behind secure authentication — never shared, never public.'
    }
]

const DIFFERENTIATORS = [
    {
        Icon: ScaleIcon,
        title: 'Not just an AI guess',
        description: 'Most tools give you one opaque AI score. Prepora backs it up with a second, deterministic score you can actually audit — matched skills, missing skills, and why.'
    },
    {
        Icon: RepeatIcon,
        title: 'Practice, not just preview',
        description: 'Seeing likely questions isn\'t the same as being ready to answer them. Prepora lets you actually practice and get feedback before the real thing.'
    },
    {
        Icon: SparkleIcon,
        title: 'A plan, not just a list',
        description: 'Questions and skill gaps are useless without a path forward. Every report comes with a trackable, day-by-day plan to close the gaps that matter most.'
    }
]

const STEPS = [
    { number: '01', title: 'Upload & Describe', description: 'Upload your resume (or describe yourself) and paste the job description you\'re targeting.' },
    { number: '02', title: 'Get Your Report', description: 'Receive a match score, tailored interview questions, and a skill-gap breakdown in seconds.' },
    { number: '03', title: 'Practice & Improve', description: 'Answer mock interview questions and get AI feedback to sharpen your responses.' },
    { number: '04', title: 'Follow Your Roadmap', description: 'Work through your personalized day-wise prep plan, tracking progress as you go.' }
]

const Landing = () => {
    const { user, loading } = useAuth()

    // if the user is already logged in, skip the landing page entirely
    if (!loading && user) {
        return <Navigate to='/dashboard' replace />
    }

    return (
        <main className='landing-page'>
            <ThemeToggle />

            <header className='landing-nav'>
                <div className='landing-nav__brand'>
                    <span className='landing-nav__mark'>P</span>
                    <span className='landing-nav__name'>Prepora</span>
                </div>
                <div className='landing-nav__actions'>
                    <Link to='/login' className='landing-nav__link'>Log In</Link>
                    <Link to='/register' className='button primary-button'>Get Started</Link>
                </div>
            </header>

            <section className='landing-hero'>
                <div className='landing-hero__glow' aria-hidden='true' />
                <p className='landing-hero__eyebrow'>AI-Powered Interview Preparation</p>
                <h1 className='landing-hero__title'>
                    Walk into your next interview <span className='highlight'>already prepared</span>
                </h1>
                <p className='landing-hero__subtitle'>
                    Upload your resume and a job description. Prepora generates tailored interview questions,
                    a transparent match score, skill-gap analysis, and a day-by-day prep plan — then lets you
                    practice with AI-powered mock interviews until you're actually ready.
                </p>
                <div className='landing-hero__ctas'>
                    <Link to='/register' className='button primary-button landing-hero__cta'>Get Started Free</Link>
                    <Link to='/login' className='button secondary-button'>I already have an account</Link>
                </div>
            </section>

            <section className='landing-steps'>
                <h2 className='landing-section-title'>How it works</h2>
                <div className='landing-steps__grid'>
                    {STEPS.map((step) => (
                        <div key={step.number} className='landing-step'>
                            <span className='landing-step__number'>{step.number}</span>
                            <h3 className='landing-step__title'>{step.title}</h3>
                            <p className='landing-step__description'>{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className='landing-features'>
                <h2 className='landing-section-title'>Everything you need to prepare</h2>
                <div className='landing-features__grid'>
                    {FEATURES.map((feature) => {
                        const { Icon, title, description } = feature
                        return (
                            <div key={title} className='landing-feature-card'>
                                <span className='landing-feature-card__icon' aria-hidden='true'><Icon /></span>
                                <h3 className='landing-feature-card__title'>{title}</h3>
                                <p className='landing-feature-card__description'>{description}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className='landing-diff'>
                <h2 className='landing-section-title'>Why Prepora, not just another AI tool</h2>
                <div className='landing-diff__grid'>
                    {DIFFERENTIATORS.map((item) => {
                        const { Icon, title, description } = item
                        return (
                            <div key={title} className='landing-diff-card'>
                                <span className='landing-diff-card__icon' aria-hidden='true'><Icon /></span>
                                <h3 className='landing-diff-card__title'>{title}</h3>
                                <p className='landing-diff-card__description'>{description}</p>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className='landing-final-cta'>
                <h2>Ready to walk in prepared?</h2>
                <p>It only takes a resume and a job description to get started.</p>
                <Link to='/register' className='button primary-button landing-final-cta__button'>Get Started Free</Link>
            </section>

            <footer className='landing-footer'>
                <span>© {new Date().getFullYear()} Prepora</span>
            </footer>
        </main>
    )
}

export default Landing
