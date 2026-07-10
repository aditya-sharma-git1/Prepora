const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, cb) => {
        const supportedTypes = new Set([
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ])

        if (!supportedTypes.has(file.mimetype)) {
            return cb(new Error("Only PDF and DOCX resumes are supported."))
        }

        cb(null, true)
    }
})


module.exports = upload
