// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')

// Import EventDAO and create an instance
const FriendDAO = require('../dao/friends_dao')
const friendDAO = new FriendDAO()

// Import EventDAO and create an instance
const UserDAO = require('../dao/users_dao')
const userDAO = new UserDAO()

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom authenticator
const { authenticateUser } = require('../utils/authenticator')

// Import custom data validators
const { validateNumber } = require('../utils/validator')


/*
 * TODO Gets all external users that have sent a friendship request to the authenticated user.
 * HTTP Method: GET
 * Endpoint: "/friends/requests"
*/
router.get('/requests', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID
        }
    }

    // Get all the users that have sent a friend request to the authenticated user
    let potentialFriends

    try {
        // Get all potential friends
        potentialFriends = await friendDAO.getPotentialFriends(USER_ID)

        // Remove password hash from each potential friend
        potentialFriends.forEach(potentialFriend => delete potentialFriend.password)
    } catch (error) {
        // Handle error on fetch all friends requests from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching all friends requests that has a user from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(potentialFriends)
})

/*
 * Gets all external users that are friends with the authenticated user.
 * HTTP Method: GET
 * Endpoint: "/friends"
*/
router.get('/', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID
        }
    }

    // Get all the friends of the authenticated user
    let friends

    try {
        // Get all friends
        friends = await friendDAO.getFriends(USER_ID)

        // Remove password hash from each friend
        friends.forEach(contact => delete contact.password)
    } catch (error) {
        // Handle error on fetch all friends from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching all friends that has a user from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(friends)
})

/*
 * Creates a friend request to external user with matching ID from authenticated user.
 * HTTP Method: POST
 * Endpoint: "/friends/{user_id}"
*/
router.post('/:userID', authenticateUser, async (req, res, next) => {
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

    // Check if exists external user with matching ID
    let externalUser 

    try {
        externalUser = await userDAO.getUserByID(externalUserID)

        // Check if external user exists
        if (!externalUser) {
            stacktrace['error'] = {
                'reason': 'External user does not exist'
            }

            return next(new ErrorAPI(
                'External user does not exist',
                HttpStatusCodes.NOT_FOUND,
                stacktrace
            ))
        }
    } catch (error) {
        // Handle error on fetch external user from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching external user from database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if authenticated user is not trying to send a friend request to himself/herself
    if (USER_ID === externalUserID) {
        stacktrace['error'] = {
            'reason': 'Authenticated user is trying to send a friend request to himself/herself'
        }

        return next(new ErrorAPI(
            'Authenticated user is trying to send a friend request to himself/herself',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Create a friend request to the external user
    let result

    try {
        // Create a friend request
        result = await friendDAO.createFriendRequest(USER_ID, externalUserID)
    } catch (error) {
        // Handle error on fetch create a friend request to the database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while creating a friend request to the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(result)
})

/*
 * Accepts friendship request from external user to authenticated user.
 * HTTP Method: PUT
 * Endpoint: "/friends/{user_id}"
*/
router.put('/:userID', authenticateUser, async (req, res, next) => {
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

    // Accept a friend request from the external user
    let result

    try {
        // Accept friend request
        result = await friendDAO.acceptFriendRequest(USER_ID, externalUserID)
    } catch (error) {
        // Handle error on fetch all messages exchanged between both users from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while accepting a friend request from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(result)
})

/*
 * Rejects a friendship request from external user to authenticated user or deletes a friendship between authenticated
 * user and external user.
 * HTTP Method: PUT
 * Endpoint: "/friends/{user_id}"
*/
router.delete('/:userID', authenticateUser, async (req, res, next) => {
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

    // Delete a friend request or friendship
    let result

    try {
        // Delete friend request or friendship
        result = await friendDAO.deleteFriendRequestOrFriendship(USER_ID, externalUserID)
    } catch (error) {
        // Handle error on fetch all messages exchanged between both users from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while rejecting a friend request or deleting a friendship from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(result)
})

module.exports = router