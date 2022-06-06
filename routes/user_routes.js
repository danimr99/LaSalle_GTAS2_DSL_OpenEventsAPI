// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../utilities/http_status_codes')

// Import UserDAO and create an instance
const UserDAO = require('../dao/user_dao')
const userDAO = new UserDAO()

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom data validators
const { validateObject, validateEmail, validatePassword, passwordMinLength } = require('../utilities/validator')

// Import custom authenticator
const { generateAuthenticationToken, authenticateUser } = require('../utilities/authenticator')

// Import custom encryption handler
const { checkPassword, encryptPassword } = require('../utilities/cypher')


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

        next(new ErrorAPI(
            'All user information must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Handle invalid email error
    if (!isEmailValid) {
        stacktrace['invalid_email'] = user.email

        next(new ErrorAPI(
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

        next(new ErrorAPI(
            `Password must be at least ${passwordMinLength} characters long`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    try {
        // Register new user to database
        await userDAO.registerUser(user)

        // Send API response
        delete user.password
        res.status(HttpStatusCodes.CREATED).send(user)
    } catch (error) {
        // Handle error on create event to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while registering a user into the database',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }
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
    let query

    try {
        query = await userDAO.getUserByEmail(credentials.email)
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
    if (query.length < 1) {
        return next(new ErrorAPI(
            'Invalid credentials or user not found',
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Ensure there is only one user matching the email address
    if (query.length > 1) {
        return next(new ErrorAPI(
            'An internal server error has occurred',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Get the user queried from database
    const user = query[0]

    // Handle invalid credentials error
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
        users = await userDAO.getAll()
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
 * Query: s => Type: String => Text to search on the specified user fields
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

    // Send response
    res.status(HttpStatusCodes.OK).json(users)
})

/*
 * Gets user by ID.
 * HTTP Method: GET
 * Endpoint: "/users/{id}"
*/
router.get('/:id', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { id } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'user_id': id
        }
    }

    // Get user by ID from database
    let user

    try {
        user = await userDAO.getUserByID(id)
    } catch (error) {
        // Handle error on get user by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if exists a user matching the ID
    if (user.length !== 1) {
        stacktrace['invalid_user_id'] = id

        return next(new ErrorAPI(
            `User with ID ${id} does not exist or was not found`,
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
 * Endpoint: "/users/{id}/statistics"
*/
// TODO Endpoint: @GET "/users/{id}/statistics"

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
        // Handle error on get user by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching a user by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }   

    // Update user depending on the fields received
    if (req.body.name) user.name = req.body.name
    if (req.body.last_name) user.last_name = req.body.last_name
    if (req.body.email) user.email = req.body.email
    if (req.body.password) user.password = await encryptPassword(req.body.password)

    // Set received data to error stacktrace
    stacktrace = {
        '_original': user
    }

    // Update user on the database
    try {
        await userDAO.updateUser(user)
    } catch (error) {
        // Handle error on update user by id from database
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
    res.status(HttpStatusCodes.OK).send(`User with ID ${USER_ID} was deleted successfully`)
})

module.exports = router