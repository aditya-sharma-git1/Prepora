const request = require("supertest")

jest.mock("../../src/models/user.model")
jest.mock("../../src/models/blacklist.model")

const userModel = require("../../src/models/user.model")
const blacklistModel = require("../../src/models/blacklist.model")
const app = require("../../src/app")

describe("POST /api/auth/register", () => {
    test("rejects request with missing fields (validation)", async () => {
        const res = await request(app).post("/api/auth/register").send({ email: "test@example.com" })
        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Validation failed.")
    })

    test("rejects duplicate account", async () => {
        userModel.findOne.mockResolvedValue({ _id: "existing-user" })

        const res = await request(app).post("/api/auth/register").send({
            username: "adityasharma",
            email: "test@example.com",
            password: "password123"
        })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/already exists/i)
    })

    test("registers a new user successfully and sets a cookie", async () => {
        userModel.findOne.mockResolvedValue(null)
        userModel.create.mockResolvedValue({
            _id: "new-user-id",
            username: "adityasharma",
            email: "test@example.com"
        })

        const res = await request(app).post("/api/auth/register").send({
            username: "adityasharma",
            email: "Test@Example.com",
            password: "password123"
        })

        expect(res.status).toBe(201)
        expect(res.body.user.email).toBe("test@example.com") // normalized by validator
        expect(res.headers[ "set-cookie" ]).toBeDefined()
        expect(res.headers[ "set-cookie" ][ 0 ]).toMatch(/token=/)
    })
})

describe("POST /api/auth/login", () => {
    const bcrypt = require("bcryptjs")

    test("rejects invalid email format (validation)", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "not-an-email", password: "x" })
        expect(res.status).toBe(400)
    })

    test("rejects login for non-existent user", async () => {
        userModel.findOne.mockResolvedValue(null)

        const res = await request(app).post("/api/auth/login").send({
            email: "nouser@example.com",
            password: "password123"
        })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/invalid email or password/i)
    })

    test("rejects login with wrong password", async () => {
        const hash = await bcrypt.hash("correct-password", 10)
        userModel.findOne.mockResolvedValue({ _id: "user-id", email: "test@example.com", password: hash })

        const res = await request(app).post("/api/auth/login").send({
            email: "test@example.com",
            password: "wrong-password"
        })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/invalid email or password/i)
    })

    test("logs in successfully with correct credentials and sets a cookie", async () => {
        const hash = await bcrypt.hash("correct-password", 10)
        userModel.findOne.mockResolvedValue({
            _id: "user-id",
            username: "adityasharma",
            email: "test@example.com",
            password: hash
        })

        const res = await request(app).post("/api/auth/login").send({
            email: "test@example.com",
            password: "correct-password"
        })

        expect(res.status).toBe(200)
        expect(res.headers[ "set-cookie" ][ 0 ]).toMatch(/token=/)
    })
})

describe("GET /api/auth/get-me", () => {
    test("rejects request with no token", async () => {
        const res = await request(app).get("/api/auth/get-me")
        expect(res.status).toBe(401)
    })

    test("rejects request with an invalid token", async () => {
        blacklistModel.findOne.mockResolvedValue(null)

        const res = await request(app)
            .get("/api/auth/get-me")
            .set("Cookie", [ "token=not-a-real-jwt" ])

        expect(res.status).toBe(401)
    })

    test("returns user details for a valid token", async () => {
        const jwt = require("jsonwebtoken")
        const token = jwt.sign({ id: "user-id", username: "adityasharma" }, process.env.JWT_SECRET)

        blacklistModel.findOne.mockResolvedValue(null)
        userModel.findById.mockResolvedValue({
            _id: "user-id",
            username: "adityasharma",
            email: "test@example.com"
        })

        const res = await request(app)
            .get("/api/auth/get-me")
            .set("Cookie", [ `token=${token}` ])

        expect(res.status).toBe(200)
        expect(res.body.user.username).toBe("adityasharma")
    })

    test("rejects a blacklisted (logged-out) token", async () => {
        const jwt = require("jsonwebtoken")
        const token = jwt.sign({ id: "user-id", username: "adityasharma" }, process.env.JWT_SECRET)

        blacklistModel.findOne.mockResolvedValue({ token }) // token is blacklisted

        const res = await request(app)
            .get("/api/auth/get-me")
            .set("Cookie", [ `token=${token}` ])

        expect(res.status).toBe(401)
    })
})
