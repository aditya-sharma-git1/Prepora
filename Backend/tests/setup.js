// runs before the test framework is installed, so env vars are ready before
// any app module (which reads process.env at require-time) gets required.
process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-jwt-secret"
process.env.GOOGLE_GENAI_API_KEY = "test-genai-key"
process.env.MONGO_URI = "mongodb://localhost:27017/test-db-not-actually-used"
process.env.CLIENT_ORIGIN = "http://localhost:5173"
