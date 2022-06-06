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
    let invalidUserFields = validateObject(user)
    const isUserFilled = invalidUserFields.length === 0 ? true : false
    const isEmailValid = validateEmail(user.email)
    const isPasswordValid = validatePassword(user.password)

    let stacktrace = {
        'received_data': user
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
        stacktrace['minimum_password_length'] = passwordMinLength
        stacktrace['received_password'] = user.password
        stacktrace['received_password_length'] = user.password.length

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
        // Already exists a user with the same email address
        stacktrace.sqlError = {
            'sql_code': error.code,
            'sql_error_number': error.errno,
            'sql_state': error.sqlState,
            'sql_message': error.sqlMessage
        }

        next(new ErrorAPI(
            `Already exists a user with the email address ${user.email}`,
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
        'email': req.body.email,
        'password': req.body.password
    }

    // Check if credentials are correctly filled
    let invalidCredentialsFields = validateObject(credentials)
    const areCredentialsFilled = invalidCredentialsFields.length === 0 ? true : false

    let stacktrace = {
        'received_data': credentials
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
    const query = await userDAO.getUserByEmail(credentials.email)

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
router.get('/', authenticateUser, async (_req, res, _next) => {
    // Get all users from database
    let users = await userDAO.getAll()

    // Remove password hash from each user
    users.forEach(user => delete user.password)

    // Send response
    res.status(HttpStatusCodes.OK).json(users)
})

/*
 * Searches users with a name, last name or email matching the value of the query parameter.
 * HTTP Method: GET
 * Endpoint: "/users/search?"
 * Query: s => String
*/
router.get('/search', authenticateUser, async (req, res, _next) => {
    // Get text to search from URL path sent as query
    const { s } = req.query

    // Send response
    res.status(HttpStatusCodes.OK).json(await userDAO.searchUsers(s))
})

/*
 * Gets user by ID.
 * HTTP Method: GET
 * Endpoint: "/users/{id}"
*/
router.get('/:id', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { id } = req.params

    // Get user by ID from database
    const user = await userDAO.getUserByID(id)

    // Check if exists a user matching the ID
    if (user.length !== 1) {
        let stacktrace = {
            'invalid_ID': id
        }

        return next(new ErrorAPI(
            `User with ID ${id} does not exist`,
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
router.put('/', authenticateUser, async (req, res, _next) => {
    // Get user ID from the authentication token
    const { USER_ID } = req

    // Get user matching with the ID
    let user = await userDAO.getUserByID(USER_ID)
    user = user[0]

    // Update user depending on the fields received
    if(req.body.name) user.name = req.body.name
    if(req.body.last_name) user.last_name = req.body.last_name
    if(req.body.email) user.email = req.body.email
    if(req.body.password) user.password = await encryptPassword(req.body.password)

    // Update user on the database
    await userDAO.updateUser(user)

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

    // Get user matching with the ID
    await userDAO.deleteUserByID(USER_ID)

    // Send response
    res.status(HttpStatusCodes.OK).send('User deleted successfully')
})

module.exports = router