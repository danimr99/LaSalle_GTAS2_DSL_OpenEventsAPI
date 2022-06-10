class ErrorAPI extends Error {
    constructor(message, statusCode, stacktrace) {
        super(message)

        this.statusCode = statusCode
        this.stacktrace = stacktrace
        Error.captureStackTrace(this)        
    }
}

module.exports = ErrorAPI