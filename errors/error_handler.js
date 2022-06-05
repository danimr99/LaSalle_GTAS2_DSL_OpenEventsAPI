const HttpStatusCodes = require('../utilities/http_status_codes')

function errorHandler(error, _req, res, _next) {
    res.header('Content-Type', 'application/json')
    res.status(error.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
        'status': error.statusCode,
        'error': error.message,
        'details': error.details,
        'stacktrace': error.stacktrace
    })
}

module.exports = { errorHandler }