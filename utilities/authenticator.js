const ErrorAPI = require('../errors/error_api')
const httpStatusCodes = require('./http_status_codes')

// Import library to handle JsonWebTokens
const jwt = require('jsonwebtoken')
const UserDAO = require('../dao/user_dao')

// Set error to throw for unauthenticated users
const authenticationError = new ErrorAPI(
    'Invalid authentication token or not registered user',
    httpStatusCodes.UNAUTHORIZED
)

function generateAuthenticationToken(user) {
    return jwt.sign({ id: user.id, name: user.name, password: user.password }, process.env.JWT_KEY)
}

async function authenticateUser(req, _res, next) {
    // Check if exists authentication token on request header
    if(!req.headers.authorization)  return next(authenticationError)

    // Get Bearer authorization token from request header
    const token = req.headers.authorization.split(' ')[1]

    // Check if exists a token on the request header
    if (!token) return next(authenticationError)

    try {
        // Verify token and get payload
        const decoded = jwt.verify(token, process.env.JWT_KEY)

        // Get the user who is the owner of the access token
        let user = await new UserDAO().getUserByID(decoded.id)
        user = user[0]

        // Check if exists user matching ID
        if(!user) return next(authenticationError)

        req.USER_ID = decoded.id
        req.USER_EMAIL = decoded.email

        return next()
    } catch (error) {
        return next(authenticationError)
    }
}

module.exports = { generateAuthenticationToken, authenticateUser }