const { computeMatchAnalysis, extractSkills, cosineSimilarity, tokenize } = require("../../src/utils/matchScorer")

describe("matchScorer.extractSkills", () => {
    test("detects single-word skills", () => {
        const skills = extractSkills("I have experience with MongoDB and Docker")
        expect(skills.has("mongodb")).toBe(true)
        expect(skills.has("docker")).toBe(true)
    })

    test("detects multi-word skills as whole phrases", () => {
        const skills = extractSkills("Strong understanding of system design and load balancing")
        expect(skills.has("system design")).toBe(true)
        expect(skills.has("load balancing")).toBe(true)
    })

    test("handles simple plural forms", () => {
        const skills = extractSkills("Built REST APIs and microservices")
        expect(skills.has("rest api")).toBe(true)
        expect(skills.has("microservices")).toBe(true)
    })

    test("does not confuse 'react' with 'react native'", () => {
        const skills = extractSkills("I know react and react native development")
        expect(skills.get("react")).toBe(2) // "react" appears within "react native" too, and standalone once
        expect(skills.get("react native")).toBe(1)
    })

    test("is case-insensitive", () => {
        const skills = extractSkills("MONGODB, MongoDB, mongodb")
        expect(skills.get("mongodb")).toBe(3)
    })

    test("returns an empty map for text with no known skills", () => {
        const skills = extractSkills("I like long walks on the beach")
        expect(skills.size).toBe(0)
    })

    test("does not match partial substrings incorrectly (e.g. 'go' inside 'good')", () => {
        const skills = extractSkills("This is a really good day")
        expect(skills.has("go")).toBe(false)
    })
})

describe("matchScorer.tokenize", () => {
    test("removes stopwords and short tokens", () => {
        const tokens = tokenize("The quick brown fox is a good developer")
        expect(tokens).not.toContain("the")
        expect(tokens).not.toContain("is")
        expect(tokens).not.toContain("a")
        expect(tokens).toContain("quick")
        expect(tokens).toContain("developer")
    })
})

describe("matchScorer.cosineSimilarity", () => {
    test("returns 1 for identical vectors", () => {
        const vec = new Map([ [ "node", 3 ], [ "mongo", 2 ] ])
        expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5)
    })

    test("returns 0 for completely disjoint vectors", () => {
        const vecA = new Map([ [ "node", 3 ] ])
        const vecB = new Map([ [ "react", 2 ] ])
        expect(cosineSimilarity(vecA, vecB)).toBe(0)
    })

    test("returns 0 when either vector is empty", () => {
        const vecA = new Map([ [ "node", 3 ] ])
        const vecB = new Map()
        expect(cosineSimilarity(vecA, vecB)).toBe(0)
    })
})

describe("matchScorer.computeMatchAnalysis", () => {
    const jobDescription = `
        Backend Engineer - Node.js, MongoDB, JWT authentication, AWS, Docker required.
        Experience with REST API design and system design fundamentals is a plus.
    `

    test("a strongly relevant resume scores meaningfully higher than an irrelevant one", () => {
        const strongResume = "Built REST APIs with Node.js and MongoDB, implemented JWT auth, deployed on AWS using Docker."
        const weakResume = "Experienced painter and graphic designer skilled in Photoshop and Illustrator."

        const strong = computeMatchAnalysis({ resume: strongResume, jobDescription })
        const weak = computeMatchAnalysis({ resume: weakResume, jobDescription })

        expect(strong.score).toBeGreaterThan(weak.score)
        expect(strong.score).toBeGreaterThan(50)
        expect(weak.score).toBeLessThan(20)
    })

    test("correctly separates matched vs missing skills", () => {
        const resume = "I know Node.js and MongoDB well."
        const result = computeMatchAnalysis({ resume, jobDescription })

        const matchedNames = result.matchedSkills.map((s) => s.skill)
        const missingNames = result.missingSkills.map((s) => s.skill)

        expect(matchedNames).toEqual(expect.arrayContaining([ "node.js", "mongodb" ]))
        expect(missingNames).toEqual(expect.arrayContaining([ "jwt", "aws", "docker" ]))
    })

    test("empty resume scores 0", () => {
        const result = computeMatchAnalysis({ resume: "", jobDescription })
        expect(result.score).toBe(0)
    })

    test("score is always between 0 and 100", () => {
        const result = computeMatchAnalysis({
            resume: "Node.js MongoDB JWT AWS Docker REST API system design ".repeat(20),
            jobDescription
        })
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(100)
    })

    test("missing/matched skills are sorted by JD importance (most-mentioned first)", () => {
        const jd = "Node.js Node.js Node.js required. MongoDB required."
        const result = computeMatchAnalysis({ resume: "", jobDescription: jd })
        expect(result.missingSkills[ 0 ].skill).toBe("node.js")
        expect(result.missingSkills[ 0 ].jdMentions).toBe(3)
    })
})
