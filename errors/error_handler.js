const HttpStatusCodes = require('../models/http_status_codes')

/*
 * Custom error handler.
*/
function errorHandler(error, _req, res, _next) {
    // Delete error information if exists
    if(error.sql) delete error.sql
    if(error.sqlMessage) delete error.sqlMessage

    res.header('Content-Type', 'application/json')
    res.status(error.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR).send({
        'status': error.statusCode,
        'error': error.message,
        'stacktrace': error.stacktrace
    })
}

module.exports = { errorHandler }