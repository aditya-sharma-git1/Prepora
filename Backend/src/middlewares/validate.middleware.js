/**
 * Generic request-validation middleware factory using Zod.
 *
 * Usage: router.post("/route", validate(someZodSchema), controller)
 *
 * Validates req.body against the given schema. On failure, responds 400 with a
 * clear list of field-level errors instead of letting bad input reach the
 * controller/DB layer.
 */
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            })
        }

        // replace body with the parsed (and possibly coerced/trimmed) data
        req.body = result.data
        next()
    }
}

module.exports = { validate }
