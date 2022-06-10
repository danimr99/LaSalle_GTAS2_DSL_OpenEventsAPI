// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')


/*
 * Custom error handler.
*/
function errorHandler(error, _req, res, _next) {
    // Delete unnecessary error information if exists
    if(error.stacktrace.sql_error !== undefined && error.stacktrace.sql_error !== null) {
        if(error.stacktrace.sql_error.sql) delete error.stacktrace.sql_error.sql
        if(error.stacktrace.sql_error.sqlMessage) delete error.stacktrace.sql_error.sqlMessage
        if(error.stacktrace.sql_error.message) delete error.stacktrace.sql_error.message
    }

    // Send error response
    res.header('Content-Type', 'application/json')
    res.status(error.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
        'status': error.statusCode,
        'error': error.message,
        'stacktrace': error.stacktrace
    })
}

module.exports = { errorHandler }