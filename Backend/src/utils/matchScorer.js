/**
 * Custom resume-to-job-description match scoring.
 *
 * Unlike the AI-generated matchScore (which is a single opaque number from an LLM),
 * this computes a deterministic, explainable score using two classic IR techniques:
 *
 *   1. Weighted skill coverage - extract known technical skills/keywords from both
 *      documents using a curated dictionary, then measure what fraction of the
 *      skills required by the job description are actually present in the resume,
 *      weighted by how often each skill is mentioned in the JD (skills mentioned
 *      more often, e.g. in a "Requirements" section repeated across the posting,
 *      are treated as more important).
 *
 *   2. Term-frequency cosine similarity - a bag-of-words vector space model comparing
 *      overall lexical similarity between the two documents, independent of the
 *      curated skill list (catches domain terms not in the dictionary).
 *
 * The final score blends both signals. This is intentionally NOT calling the LLM -
 * it's meant to be a transparent, auditable second opinion alongside the AI's score.
 */

// A curated dictionary of common technical skills/keywords, grouped for maintainability.
// Longer/multi-word entries are matched first so e.g. "react native" doesn't get
// double counted as just "react".
const SKILL_DICTIONARY = [
    // languages
    "javascript", "typescript", "python", "java", "c++", "c#", "golang", "go", "rust",
    "ruby", "php", "kotlin", "swift", "sql", "html", "css", "scss",
    // frontend
    "react", "react native", "next.js", "nextjs", "vue", "angular", "svelte", "redux",
    "tailwind", "tailwindcss", "webpack", "vite",
    // backend
    "node.js", "nodejs", "express", "express.js", "django", "flask", "spring boot",
    "spring", "fastapi", "graphql", "rest api", "grpc", "microservices",
    // databases
    "mongodb", "postgresql", "postgres", "mysql", "redis", "elasticsearch", "dynamodb",
    "sqlite", "cassandra", "firebase",
    // cloud & devops
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins",
    "github actions", "nginx", "linux",
    // ai / ml
    "machine learning", "deep learning", "tensorflow", "pytorch", "llm", "nlp",
    "computer vision", "gemini", "openai", "langchain",
    // concepts
    "system design", "data structures", "algorithms", "oop", "design patterns",
    "unit testing", "agile", "scrum", "api design", "authentication", "oauth", "jwt",
    "caching", "load balancing", "message queue", "websocket", "testing"
].sort((a, b) => b.length - a.length) // longest first, so multi-word phrases match before their substrings

const STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "should", "could", "this", "that", "these", "those", "i", "you",
    "we", "they", "it", "as", "by", "from", "about", "into", "through", "during", "our",
    "your", "their", "his", "her", "its", "not", "no", "so", "if", "than", "then"
])

function normalize(text = "") {
    return text.toLowerCase()
}

/**
 * Extracts known skills from text using the curated dictionary, matching whole
 * words/phrases (not substrings) and returns a Map of skill -> occurrence count.
 */
function extractSkills(text) {
    const normalized = normalize(text)
    const counts = new Map()

    for (const skill of SKILL_DICTIONARY) {
        // escape regex special chars in the skill phrase (e.g. "c++", "c#")
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        // word boundaries don't work well around '+' or '#', so use lookaround on
        // alphanumeric neighbors instead for a "whole token" match. Also allow an
        // optional trailing 's' so plurals (e.g. "REST APIs", "microservices") match.
        const pattern = new RegExp(`(?<![a-z0-9])${escaped}s?(?![a-z0-9])`, "g")
        const matches = normalized.match(pattern)

        if (matches && matches.length > 0) {
            counts.set(skill, matches.length)
        }
    }

    return counts
}

/**
 * Tokenizes text into words for the bag-of-words model, removing stopwords and
 * very short tokens.
 */
function tokenize(text) {
    return normalize(text)
        .replace(/[^a-z0-9+#. ]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !STOPWORDS.has(token))
}

function termFrequencyVector(tokens) {
    const vector = new Map()
    for (const token of tokens) {
        vector.set(token, (vector.get(token) || 0) + 1)
    }
    return vector
}

/**
 * Standard cosine similarity between two term-frequency vectors (bag-of-words model).
 * Returns a value between 0 and 1.
 */
function cosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    const vocabulary = new Set([ ...vectorA.keys(), ...vectorB.keys() ])

    for (const term of vocabulary) {
        const a = vectorA.get(term) || 0
        const b = vectorB.get(term) || 0
        dotProduct += a * b
        magnitudeA += a * a
        magnitudeB += b * b
    }

    if (magnitudeA === 0 || magnitudeB === 0) return 0

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}

/**
 * Computes the full custom match analysis between a resume and a job description.
 *
 * @returns {{
 *   score: number,               // final blended score, 0-100
 *   skillCoverageScore: number,  // 0-100, weighted skill coverage component
 *   textSimilarityScore: number, // 0-100, cosine similarity component
 *   matchedSkills: {skill: string, jdMentions: number}[],
 *   missingSkills: {skill: string, jdMentions: number}[]
 * }}
 */
function computeMatchAnalysis({ resume = "", jobDescription = "", selfDescription = "" }) {
    const resumeText = `${resume}\n${selfDescription}`

    const jdSkills = extractSkills(jobDescription)
    const resumeSkills = extractSkills(resumeText)

    const matchedSkills = []
    const missingSkills = []
    let totalWeight = 0
    let matchedWeight = 0

    for (const [ skill, jdMentions ] of jdSkills.entries()) {
        totalWeight += jdMentions
        if (resumeSkills.has(skill)) {
            matchedWeight += jdMentions
            matchedSkills.push({ skill, jdMentions })
        } else {
            missingSkills.push({ skill, jdMentions })
        }
    }

    // sort by importance (most-mentioned-in-JD first) so the most critical gaps surface first
    matchedSkills.sort((a, b) => b.jdMentions - a.jdMentions)
    missingSkills.sort((a, b) => b.jdMentions - a.jdMentions)

    const skillCoverageScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0

    const textSimilarityScore = cosineSimilarity(
        termFrequencyVector(tokenize(jobDescription)),
        termFrequencyVector(tokenize(resumeText))
    ) * 100

    // weighted blend: skill coverage is the stronger, more meaningful signal here since
    // it's specifically about required competencies; text similarity is a secondary
    // signal that catches domain overlap not captured by the curated dictionary.
    const score = Math.round((skillCoverageScore * 0.7) + (textSimilarityScore * 0.3))

    return {
        score: Math.min(100, Math.max(0, score)),
        skillCoverageScore: Math.round(skillCoverageScore),
        textSimilarityScore: Math.round(textSimilarityScore),
        matchedSkills,
        missingSkills
    }
}

module.exports = { computeMatchAnalysis, extractSkills, cosineSimilarity, tokenize }
