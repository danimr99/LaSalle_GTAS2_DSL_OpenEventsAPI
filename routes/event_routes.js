// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../utilities/http_status_codes')

// Import EventDAO and create an instance
const EventDAO = require('../dao/event_dao')
const eventDAO = new EventDAO()

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom authenticator
const { authenticateUser } = require('../utilities/authenticator')


/*
 * Creates a user.
 * HTTP Method: POST
 * Endpoint: "/users"
*/


module.exports = router