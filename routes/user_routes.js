// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../utilities/http_status_codes')

// Import UserDAO and create an instance
const UserDAO = require('../dao/user_dao')
const ErrorAPI = require('../errors/error_api')
const userDAO = new UserDAO()

// Import custom data validators
const { validateObject, validateEmail, validatePassword, passwordMinLength } = require('../utilities/validator')

// Import custom authenticator
const { generateAuthenticationToken, authenticateUser } = require('../utilities/authenticator')

// Import custom encryption handler
const { checkPassword } = require('../utilities/cypher')


/*
 * Creates a user
 * Endpoint: @POST "/users"
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
        'receivedData': user
    }

    // Handle user not correctly filled error
    if (!isUserFilled) {
        stacktrace.invalidUserFields = invalidUserFields

        next(new ErrorAPI(
            'All user information must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Handle invalid email error
    if (!isEmailValid) {
        stacktrace.invalidEmail = user.email

        next(new ErrorAPI(
            'User has introduced an invalid email',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Handle password not meeting requirements error
    if (!isPasswordValid) {
        stacktrace.minimumPasswordLength = passwordMinLength
        stacktrace.receivedPassword = user.password
        stacktrace.receivedPasswordLength = user.password.length

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
            'sqlCode': error.code,
            'sqlErrorNumber': error.errno,
            'sqlState': error.sqlState,
            'sqlMessage': error.sqlMessage
        }

        next(new ErrorAPI(
            `Already exists a user with the email address ${user.email}`,
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }
})

/*
 * Authenticates a user
 * Endpoint: @POST "/users/login"
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
        'receivedData': credentials
    }

    // Handle credentials not correctly filled error
    if (!areCredentialsFilled) {
        stacktrace.invalidUserFields = invalidCredentialsFields

        next(new ErrorAPI(
            'Credentials fields (email address and password) must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get user matching email address
    const query = await userDAO.getUserByEmail(credentials.email)

    // Check if exists a user matching the email address
    if (query.length < 1) {
        next(new ErrorAPI(
            'Invalid credentials or user not found',
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Ensure there is only one user matching the email address
    if (query.length > 1) {
        next(new ErrorAPI(
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
 * Gets all users
 * Endpoint: @GET "/users"
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
 * Searches users with a name, last name or email matching the value of the query parameter
 * Endpoint: @GET "/users/search?s=text"
*/
router.get('/search', authenticateUser, async (req, res, _next) => {
    // Get text to search from URL path sent as query
    const { s } = req.query

    // Send response
    res.status(HttpStatusCodes.OK).json(await userDAO.searchUsers(s))
})

/*
 * Get user by ID
 * Endpoint: @GET "/users/{id}"
*/
router.get('/:id', authenticateUser, async (req, res, next) => {
    // Get user ID from the URL path sent as parameter
    const { id } = req.params

    // Get user by ID from database
    const user = await userDAO.getUserByID(id)

    // Check if exists a user matching the ID
    if (user.length !== 1) {
        let stacktrace = {
            'invalidID': id
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

module.exports = router