// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')

// Import EventDAO and create an instance
const MessageDAO = require('../dao/messages_dao')
const messageDAO = new MessageDAO()

// Import custom date time handler
const Dates = require('../utils/dates')

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom authenticator
const { authenticateUser } = require('../utils/authenticator')

// Import custom data validators
const { validateObject, validateNumber } = require('../utils/validator')

/*
 * Creates a message.
 * HTTP Method: POST
 * Endpoint: "/messages"
*/
router.post('/', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Get message from HTTP request body
    const message = {
        content: req.body.content,
        user_id_send: USER_ID,
        user_id_received: req.body.user_id_received
    }

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': message
    }

    // Check if all message fields are correctly fulfilled
    const invalidMessageFields = validateObject(message)
    const isMessageFilled = invalidMessageFields.length === 0 ? true : false

    // Handle event not correctly filled error
    if (!isMessageFilled) {
        stacktrace['invalid_message_fields'] = invalidMessageFields

        return next(new ErrorAPI(
            'All message information must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Check that user cannot send a message to himself/herself
    if (message.user_id_send === message.user_id_received) {
        return next(new ErrorAPI(
            'You cannot send a message to yourself',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Create message on the database
    try {
        // Set message date time
        message['timestamp'] = Dates.getCurrentDateTime()

        // Insert message into database
        await messageDAO.createMessage(message)
    } catch (error) {
        // Handle error on create message to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while inserting a message to the database',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.CREATED).json(message)
})

/*
 * Gets all external users that are messaging the authenticated user.
 * HTTP Method: GET
 * Endpoint: "/messages/users"
*/
router.get('/users', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID
        }
    }

    // Get all the users that have sent a message to the authenticated user
    let contacts

    try {
        // Get all contacts
        contacts = await messageDAO.getUserContacts(USER_ID)

        // Remove password hash from each user
        contacts.forEach(contact => delete contact.password)
    } catch (error) {
        // Handle error on fetch all users that have messaged a user from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching all users that have messaged a user from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(contacts)
})

/*
 * Gets all messages between the external user with matching ID and the authenticated user.
 * HTTP Method: GET
 * Endpoint: "/messages/{user_id}"
*/
router.get('/:userID', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Get external user ID from the URL path sent as parameter
    const externalUserID = req.params.userID

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID,
            'external_user_id': externalUserID
        }
    }

    // Check if external user ID is a number
    if (!validateNumber(externalUserID)) {
        stacktrace['error'] = {
            'reason': 'External user ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid external user ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get messages exchanged between both users ID
    let messages

    try {
        messages = await messageDAO.getMessagesExchangedBetweenUsers(USER_ID, externalUserID)
    } catch (error) {
        // Handle error on fetch all messages exchanged between both users from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching all messages exchanged between users from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(messages)
})

// TODO - Add route to delete a specific message

module.exports = router