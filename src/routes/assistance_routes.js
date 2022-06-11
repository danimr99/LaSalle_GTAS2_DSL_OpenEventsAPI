// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')

// Import AssistanceDAO and create an instance
const AssistanceDAO = require('../dao/assistance_dao')
const assistanceDAO = new AssistanceDAO()

// Import EventDAO and create an instance
const EventDAO = require('../dao/event_dao')
const eventDAO = new EventDAO()

// Import UserDAO and create an instance
const UserDAO = require('../dao/user_dao')
const userDAO = new UserDAO()

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom authenticator
const { authenticateUser } = require('../utils/authenticator')

// Import custom data validators
const { validateNumber, validatePunctuation } = require('../utils/validator')


/*
 * Creates an assistance of the authenticated user for event with matching ID.
 * HTTP Method: POST
 * Endpoint: "/assistances/{event_id}"
*/
router.post('/:eventID', authenticateUser, async (req, res, next) => {
    // Get event ID from the URL path sent as parameter
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
        event = await eventDAO.getEventByID(eventID)

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
router.get('/:userID/:eventID', authenticateUser, async (req, res, next) => {
    // Get user ID and event ID from the URL path sent as parameter
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

    // Check if exists user with matching ID
    let user

    try {
        user = await userDAO.getUserByID(userID)

        if (!user) {
            return next(new ErrorAPI(
                'User does not exist or was not found',
                HttpStatusCodes.NOT_FOUND,
                stacktrace
            ))
        }
    } catch (error) {
        // Handle error on get user by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching an event by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if exists event with matching ID
    let event

    try {
        event = await eventDAO.getEventByID(eventID)

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

/*
 * Edits assistance of user with matching id for the event with matching ID.
 * HTTP Method: PUT
 * Endpoint: "/assistances/{event_id}"
*/
router.put('/:eventID', authenticateUser, async (req, res, next) => {
    // Get event ID from the URL path sent as parameter
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
        event = await eventDAO.getEventByID(eventID)

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

    // Check if exists assistance of user with matching ID for event with matching ID
    let assistance

    try {
        assistance = await assistanceDAO.getAssistanceOfUserForEvent(USER_ID, eventID)

        if (!assistance) {
            return next(new ErrorAPI(
                'Assistance does not exist or was not found',
                HttpStatusCodes.NOT_FOUND,
                stacktrace
            ))
        }
    } catch (error) {
        // Handle error on get assistance of user for event from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching assistance of user for event from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if event has finished
    if (event.eventEnd_date > new Date()) {
        return next(new ErrorAPI(
            'Event has not finished yet',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Update assistance depending on the fields received
    if (req.body.punctuation) {
        // Get punctuation from the HTTP request body
        const { punctuation } = req.body

        // Check if punctuation is valid
        if (!validatePunctuation(punctuation)) {
            stacktrace['error'] = {
                'reason': 'Punctuation is not a number between 0 and 10'
            }

            return next(new ErrorAPI(
                'Invalid punctuation',
                HttpStatusCodes.BAD_REQUEST,
                stacktrace
            ))
        } else {
            // Update punctuation of assistance
            assistance.punctuation = punctuation
        }
    }

    if (req.body.comment) assistance.comment = req.body.comment

    // Set received data to error stacktrace
    stacktrace = {
        '_original': assistance
    }

    // Edit assistance of user with matching ID for event with matching ID
    let result

    try {
        result = await assistanceDAO.editAssistance(assistance)
    } catch (error) {
        // Handle error on edit assistance to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while editing an assistance to the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(result)
})

/*
 * Deletes assistance of a user matching the ID for the event with matching ID if the owner 
 * of the event is the authenticated user.
 * HTTP Method: DELETE
 * Endpoint: "/assistances/{user_id}/{event_id}"
*/
router.delete('/:userID/:eventID', authenticateUser, async (req, res, next) => {
    // Get event ID from the URL path sent as parameter
    const { userID, eventID } = req.params

    // Get authenticated user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'authenticated_user_id': USER_ID,
            'user_id': userID,
            'event_id': eventID
        }
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
        event = await eventDAO.getEventByID(eventID)

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

    // Check if authenticated user is the owner of the event with matching ID
    if (USER_ID !== event.owner_id) {
        return next(new ErrorAPI(
            'Authenticated user is not the owner of the event',
            HttpStatusCodes.UNAUTHORIZED,
            stacktrace
        ))
    }

    // Check if exists assistance of authenticated user for event with matching ID
    let assistance

    try {
        assistance = await assistanceDAO.getAssistanceOfUserForEvent(userID, eventID)

        if (!assistance) {
            return next(new ErrorAPI(
                'Assistance does not exist or was not found',
                HttpStatusCodes.NOT_FOUND,
                stacktrace
            ))
        }
    } catch (error) {
        // Handle error on get assistance of authenticated user for event from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching assistance of user for event from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Delete assistance of authenticated user for event with matching ID
    let result

    try {
        result = await assistanceDAO.deleteAssistance(assistance)
    } catch (error) {
        // Handle error on delete assistance of authenticated user for event from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while deleting an assistance of the authenticated user for event from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(result)
})

module.exports = router