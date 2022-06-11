// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')

// Import UserDAO and create an instance
const UserDAO = require('../dao/user_dao')
const userDAO = new UserDAO()

// Import EventDAO and create an instance
const EventDAO = require('../dao/event_dao')
const eventDAO = new EventDAO()

// Import FriendDAO and create an instance
const FriendDAO = require('../dao/friend_dao')
const friendDAO = new FriendDAO()

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom data validators
const {
    validateObject,
    validateEmail,
    validatePassword,
    validateNumber,
    passwordMinLength
} = require('../utils/validator')

// Import custom authenticator
const { generateAuthenticationToken, authenticateUser } = require('../utils/authenticator')

// Import custom encryption handler
const { checkPassword, encryptPassword } = require('../utils/cypher')


/*
 * Creates a user.
 * HTTP Method: POST
 * Endpoint: "/users"
*/
router.post('/', async (req, res, next) => {
    // Get all user data from the request body
    let user = {
        name: req.body.name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        image: req.body.image
    }

    // Check if user data meets requirements
    const invalidUserFields = validateObject(user)
    const isUserFilled = invalidUserFields.length === 0 ? true : false
    const isEmailValid = validateEmail(user.email)
    const isPasswordValid = validatePassword(user.password)

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': user
    }

    // Handle user not correctly filled error
    if (!isUserFilled) {
        stacktrace['invalid_user_fields'] = invalidUserFields

        return next(new ErrorAPI(
            'All user information must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Handle invalid email error
    if (!isEmailValid) {
        stacktrace['invalid_email'] = user.email

        return next(new ErrorAPI(
            'User has introduced an invalid email',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Handle password not meeting requirements error
    if (!isPasswordValid) {
        stacktrace['invalid_password'] = {
            'minimum_password_length': passwordMinLength,
            'received_password': user.password,
            'received_password_length': user.password.length
        }

        return next(new ErrorAPI(
            `Password must be at least ${passwordMinLength} characters long`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Check if email address already exists
    let userByEmail
    try {
        userByEmail = await userDAO.getUserByEmail(user.email)
        userByEmail = userByEmail[0]

        if (userByEmail) {
            stacktrace['invalid_email'] = user.email

            return next(new ErrorAPI(
                'Email address already exists',
                HttpStatusCodes.BAD_REQUEST,
                stacktrace
            ))
        }
    } catch (error) {
        // Handle error on create user to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by email from the database',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Register new user to database
    try {
        await userDAO.registerUser(user)
    } catch (error) {
        // Handle error on create user to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while registering a user into the database',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Send API response
    delete user.password
    res.status(HttpStatusCodes.CREATED).json(user)
})

/*
 * Authenticates a user.
 * HTTP Method: POST
 * Endpoint: "/users/login"
*/
router.post('/login', async (req, res, next) => {
    // Get email and password from request body
    const credentials = {
        email: req.body.email,
        password: req.body.password
    }

    // Check if credentials are correctly filled
    const invalidCredentialsFields = validateObject(credentials)
    const areCredentialsFilled = invalidCredentialsFields.length === 0 ? true : false

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': credentials
    }

    // Handle credentials not correctly filled error
    if (!areCredentialsFilled) {
        stacktrace['invalid_credentials_fields'] = invalidCredentialsFields

        return next(new ErrorAPI(
            'Credentials fields (email address and password) must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching email address
    let user

    try {
        user = await userDAO.getUserByEmail(credentials.email)
        user = user[0]
    } catch (error) {
        // Handle error on get user by email address from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by email address from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if exists a user matching the email address
    if (!user) {
        return next(new ErrorAPI(
            'Invalid credentials or user not found',
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Check if password is correct
    if (!await checkPassword(credentials.password, user.password)) {
        return next(new ErrorAPI(
            'Invalid credentials or user not found',
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Send authentication token for valid credentials
    res.status(HttpStatusCodes.OK).json({
        'accessToken': generateAuthenticationToken(user)
    })
})

/*
 * Gets all users.
 * HTTP Method: GET
 * Endpoint: "/users"
*/
router.get('/', authenticateUser, async (_req, res, next) => {
    // Get all users from database
    let users

    try {
        users = await userDAO.getAllUsers()
    } catch (error) {
        // Handle error on get users from database
        let stacktrace = {
            'sql_error': error
        }

        return next(new ErrorAPI(
            'An error has occurred while fetching all users from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Remove password hash from each user
    users.forEach(user => delete user.password)

    // Send response
    res.status(HttpStatusCodes.OK).json(users)
})

/*
 * Searches users with a name, last name or email matching the value of the query parameter.
 * HTTP Method: GET
 * Endpoint: "/users/search?"
 * Query: 
 *      s => Type: String => Text to search on the specified user fields
*/
router.get('/search', authenticateUser, async (req, res, next) => {
    // Get text to search from URL path sent as query
    const { s } = req.query

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            's': s
        }
    }

    // Get all users matching the value of the query parameter
    let users

    try {
        users = await userDAO.searchUsers(s)
    } catch (error) {
        // Handle error on get users from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching all users from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Remove password hash from each user
    users.forEach(user => delete user.password)

    // Send response
    res.status(HttpStatusCodes.OK).json(users)
})

/*
 * Gets user by ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}"
*/
router.get('/:userID', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
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

    // Get user by ID from database
    let user

    try {
        user = await userDAO.getUserByID(userID)
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if exists a user matching the ID
    if (!user) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(user)
})

/*
 * Gets the user statistics: average score given for events (punctuation), number of comments written for
 * events, and percentage of users with lower number of comments than this user.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/statistics"
*/
// TODO Endpoint: @GET "/users/{user_id}/statistics"

/*
 * Edits specified fields of the authenticated user.
 * HTTP Method: PUT
 * Endpoint: "/users"
*/
router.put('/', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID
        }
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(USER_ID)
        user = user[0]
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${USER_ID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Update user depending on the fields received
    if (req.body.name) user.name = req.body.name
    if (req.body.last_name) user.last_name = req.body.last_name

    if (req.body.email) {
        // Check if email is valid
        if(!validateEmail(req.body.email)) {
            stacktrace['error'] = {
                'reason': 'Email is not valid'
            }

            return next(new ErrorAPI(
                'Invalid email',
                HttpStatusCodes.BAD_REQUEST,
                stacktrace
            ))
        }

        // Set new email
        user.email = req.body.email
    }

    if (req.body.password) {
        // Check if password is valid
        if(!validatePassword(req.body.password)) {
            stacktrace['error'] = {
                'reason': 'Password is not valid'
            }

            return next(new ErrorAPI(
                'Invalid password',
                HttpStatusCodes.BAD_REQUEST,
                stacktrace
            ))
        }

        // Set new password
        user.password = await encryptPassword(req.body.password)
    }

    if (req.body.image) user.image = req.body.image

    // Change data of error stacktrace
    stacktrace = {
        '_original': user
    }

    // Update user on the database
    try {
        await userDAO.updateUser(user)
    } catch (error) {
        // Handle error on update user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while updating a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    delete user.id
    res.status(HttpStatusCodes.OK).json(user)
})

/*
 * Deletes the authenticated user.
 * HTTP Method: DELETE
 * Endpoint: "/users"
*/
router.delete('/', authenticateUser, async (req, res, next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': USER_ID
        }
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(USER_ID)
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${USER_ID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Delete user matching with the ID
    try {
        await userDAO.deleteUserByID(USER_ID)
    } catch (error) {
        // Handle error on delete user by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while deleting a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // TODO Delete user on all possible relations/queries (events, friends, messages, assistances...)

    // Send response
    res.status(HttpStatusCodes.OK).json({
        'message': `User with ID ${USER_ID} was deleted successfully`
    })
})

/*
 * Gets all events created by user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events"
*/
router.get('/:userID/events', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all events created by user with matching ID
    let events

    try {
        events = await eventDAO.getEventsCreatedByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error
        
        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets future events created by user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events/future"
*/
router.get('/:userID/events/future', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all future events created by user with matching ID
    let events

    try {
        events = await eventDAO.getFutureEventsCreatedByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets finished events created by user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events/finished"
*/
router.get('/:userID/events/finished', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all finished events created by user with matching ID
    let events

    try {
        events = await eventDAO.getFinishedEventsCreatedByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets active events created by user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/events/finished"
*/
router.get('/:userID/events/current', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    } catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all active events created by user with matching ID
    let events

    try {
        events = await eventDAO.getActiveEventsCreatedByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets all events with assistance from user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances"
*/
router.get('/:userID/assistances', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    }
    catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all events with assistance from user with matching ID
    let events

    try {
        events = await eventDAO.getAssistancesByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets all future events with assistance from user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances/future"
*/
router.get('/:userID/assistances/future', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    }
    catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all future events with assistance from user with matching ID
    let events

    try {
        events = await eventDAO.getFutureAssistancesByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets all finished events with assistance from user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/assistances/future"
*/
router.get('/:userID/assistances/finished', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    }
    catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all finished events with assistance from user with matching ID
    let events

    try {
        events = await eventDAO.getFinishedAssistancesByUser(userID)
    } catch (error) {
        // Handle error on get events by user ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching events by user ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets all users who are friends with user with matching ID.
 * HTTP Method: GET
 * Endpoint: "/users/{user_id}/friends"
*/
router.get('/:userID/friends', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { userID } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': userID
        }
    }

    // Check if user ID is a number
    if (!validateNumber(userID)) {
        stacktrace['invalid_user_id'] = userID

        return next(new ErrorAPI(
            `User ID ${userID} is not a number`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching with the ID
    let user

    try {
        user = await userDAO.getUserByID(userID)
    }
    catch (error) {
        // Handle error on get user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if user exists
    if (!user) {
        return next(new ErrorAPI(
            `User with ID ${userID} does not exist or was not found`,
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get all users who are friends with user with matching ID
    let friends

    try {
        friends = await friendDAO.getFriends(userID)
    } catch (error) {
        // Handle error on get friends of user by ID from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching friends of a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(friends)
})

module.exports = router