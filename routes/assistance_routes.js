// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')

// Import EventDAO and create an instance
const AssistanceDAO = require('../dao/assistance_dao')
const assistanceDAO = new AssistanceDAO()

// Import EventDAO and create an instance
const EventDAO = require('../dao/event_dao')
const eventDAO = new EventDAO()

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom authenticator
const { authenticateUser } = require('../utilities/authenticator')

// Import custom data validators
const { validateNumber } = require('../utilities/validator')


/*
 * Creates an assistance of the authenticated user for event with matching ID.
 * HTTP Method: POST
 * Endpoint: "/assistances/{event_id}"
*/
router.post('/:eventID', authenticateUser, async (req, res, next) => {
    // Get event ID and event ID from the URL path sent as parameter
    const { eventID } = req.params

    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID,
            'event_id': eventID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(USER_ID)) {
        stacktrace['error'] = {
            'reason': 'User ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid user ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Check if event ID is a number
    if (!validateNumber(eventID)) {
        stacktrace['error'] = {
            'reason': 'Event ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid event ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Check if exists event with matching ID
    let event

    try {
        event = await eventDAO.getEventById(eventID)

        if (!event) {
            return next(new ErrorAPI(
                'Event does not exist or was not found',
                HttpStatusCodes.NOT_FOUND,
                stacktrace
            ))
        }
    } catch (error) {
        // Handle error on get event by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching an event by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }


    // Create assistance of user with matching ID for event with matching ID
    let result

    try {
        result = await assistanceDAO.createAssistance(USER_ID, eventID)
    } catch (error) {
        // Handle error on create assistance to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while creating an assistance to the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(result)
})

/*
 * Gets assistance of user with matching ID for event with matching ID.
 * HTTP Method: GET
 * Endpoint: "/assistances/{user_id}/{event_id}"
*/
// TODO: Implement
router.get('/:userID/:eventID', authenticateUser, async (req, res, next) => {
    // Get event ID and event ID from the URL path sent as parameter
    const { userID, eventID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID,
            'event_id': eventID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['error'] = {
            'reason': 'User ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid user ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Check if event ID is a number
    if (!validateNumber(eventID)) {
        stacktrace['error'] = {
            'reason': 'Event ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid event ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get assistance of user with matching ID for event with matching ID
    let assistance

    try {
        assistance = await assistanceDAO.getAssistanceOfUserForEvent(userID, eventID)
    } catch (error) {
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching assistance of user for event from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(assistance)
})

// TODO Get all assistances of a user with matching ID

module.exports = router