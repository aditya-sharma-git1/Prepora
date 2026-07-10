function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function severityColor(severity) {
    if (severity === "high") return "#c0392b"
    if (severity === "medium") return "#d68910"
    return "#2e7d32"
}

const resourceTypeLabel = {
    course: "Course",
    article: "Article",
    video: "Video",
    practice: "Practice",
    book: "Book"
}

function buildInterviewReportHtml(report) {
    const {
        title,
        matchScore,
        technicalQuestions = [],
        behavioralQuestions = [],
        skillGaps = [],
        preparationPlan = [],
        customMatch
    } = report

    const questionsBlock = (heading, questions) => `
        <h2>${escapeHtml(heading)}</h2>
        ${questions.map((q, i) => `
            <div class="question">
                <p class="q-title">${i + 1}. ${escapeHtml(q.question)}</p>
                <p class="q-meta"><strong>Why it's asked:</strong> ${escapeHtml(q.intention)}</p>
                <p class="q-answer"><strong>How to answer:</strong> ${escapeHtml(q.answer)}</p>
            </div>
        `).join("")}
    `

    const skillGapsBlock = `
        <h2>Skill Gaps &amp; Suggested Resources</h2>
        ${skillGaps.map((g) => `
            <div class="question">
                <p class="q-title">${escapeHtml(g.skill)} <span class="badge" style="background:${severityColor(g.severity)}">${escapeHtml(g.severity)}</span></p>
                ${g.resource ? `
                    <p class="q-meta"><strong>${escapeHtml(resourceTypeLabel[g.resource.type] || g.resource.type)}:</strong> ${escapeHtml(g.resource.title)}</p>
                    <p class="q-answer">${escapeHtml(g.resource.description)}</p>
                ` : ""}
            </div>
        `).join("")}
    `

    const prepPlanBlock = `
        <h2>Preparation Plan</h2>
        ${preparationPlan.map((day) => `
            <div class="day">
                <p class="day-title">Day ${day.day}: ${escapeHtml(day.focus)}</p>
                <ul>
                    ${(day.tasks || []).map((t) => `<li class="${t.completed ? 'task-done' : ''}">${t.completed ? '&#10003; ' : ''}${escapeHtml(t.text)}</li>`).join("")}
                </ul>
            </div>
        `).join("")}
    `

    return `
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 0; padding: 0; }
            .header { background: #1a1a2e; color: white; padding: 24px 32px; }
            .header h1 { margin: 0 0 6px 0; font-size: 22px; }
            .score { font-size: 14px; opacity: 0.9; }
            .content { padding: 24px 32px; }
            h2 { font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 6px; margin-top: 28px; }
            .question { margin: 12px 0; padding: 10px 14px; background: #f7f7fb; border-left: 3px solid #1a1a2e; border-radius: 4px; }
            .q-title { font-weight: bold; margin: 0 0 6px 0; }
            .q-meta, .q-answer { margin: 4px 0; font-size: 13px; line-height: 1.4; }
            .skill-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .skill-table th, .skill-table td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
            .badge { color: white; padding: 2px 10px; border-radius: 10px; font-size: 12px; text-transform: capitalize; }
            .day { margin: 10px 0; }
            .day-title { font-weight: bold; margin: 0 0 4px 0; font-size: 13px; }
            .day ul { margin: 4px 0 0 18px; font-size: 13px; }
            .task-done { color: #2e7d32; text-decoration: line-through; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Interview Prep Report — ${escapeHtml(title)}</h1>
            <div class="score">AI Match Score: ${matchScore}/100</div>
            ${customMatch ? `<div class="score">Keyword Match Score: ${customMatch.score}/100 (skill coverage ${customMatch.skillCoverageScore}%, text similarity ${customMatch.textSimilarityScore}%)</div>` : ""}
        </div>
        <div class="content">
            ${customMatch ? `
                <h2>Keyword-Based Match Analysis</h2>
                <p style="font-size:12px;color:#555;">Computed independently of the AI, using skill-dictionary matching and text similarity, as a transparent second opinion alongside the AI match score above.</p>
                <table class="skill-table">
                    <thead><tr><th>Matched Skills</th><th>Mentions in JD</th></tr></thead>
                    <tbody>
                        ${customMatch.matchedSkills.map((s) => `<tr><td>${escapeHtml(s.skill)}</td><td>${s.jdMentions}</td></tr>`).join("")}
                    </tbody>
                </table>
                ${customMatch.missingSkills.length > 0 ? `
                    <table class="skill-table" style="margin-top:10px;">
                        <thead><tr><th>Missing Skills</th><th>Mentions in JD</th></tr></thead>
                        <tbody>
                            ${customMatch.missingSkills.map((s) => `<tr><td>${escapeHtml(s.skill)}</td><td>${s.jdMentions}</td></tr>`).join("")}
                        </tbody>
                    </table>
                ` : ""}
            ` : ""}
            ${questionsBlock("Technical Questions", technicalQuestions)}
            ${questionsBlock("Behavioral Questions", behavioralQuestions)}
            ${skillGapsBlock}
            ${prepPlanBlock}
        </div>
    </body>
    </html>
    `
}

module.exports = { buildInterviewReportHtml }
