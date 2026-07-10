require("dotenv").config()
const { validateEnv } = require("./src/config/env")

async function startServer() {
    validateEnv()

    const app = require("./src/app")
    const connectToDB = require("./src/config/database")

    await connectToDB()

    const port = process.env.PORT || 3000

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}

startServer().catch((error) => {
    console.error(error.message)
    process.exit(1)
})
