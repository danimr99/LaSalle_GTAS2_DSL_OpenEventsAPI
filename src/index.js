// Import to use .env files 
require('dotenv').config()

// Import ExpressJS
const express = require('express')

// Import Morgan
const morgan = require('morgan')

// Import Helmet
const helmet = require('helmet')

// Import MySQL2
const mysql = require('mysql2')

// Create an object containing all the required information
// to connect to a MySQL database from a .env file
const database = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
}

// Establish a connection to database
global.connection = mysql.createConnection(database)

// Create an Express instance and set the port
const app = express()
const port = 3000

// Import custom routes
const userRoutes = require('./routes/users_routes')
const eventRoutes = require('./routes/events_routes')
const assistanceRoutes = require('./routes/assistances_routes')
const messageRoutes = require('./routes/messages_routes')
const friendRoutes = require('./routes/friends_routes')

// Custom error and error handler
const ErrorAPI = require('./errors/error_api')
const { errorHandler } = require('./errors/error_handler')

// Import HTTP status codes
const HttpStatusCodes = require('./models/http_status_codes')

// Middlewares
app.use(morgan('tiny'))
app.use(helmet())
app.use(express.json())

// Routes
app.use('/users', userRoutes)
app.use('/events', eventRoutes)
app.use('/assistances', assistanceRoutes)
app.use('/messages', messageRoutes)
app.use('/friends', friendRoutes)

// Set default endpoint for unknown requests
app.all('*', (req, _res, next) => {
    const stacktrace = {
        'http_method': req.method,
        'url': req.originalUrl
    }

    return next(new ErrorAPI(
        'Requested endpoint does not exist on the API', 
        HttpStatusCodes.NOT_FOUND,
        stacktrace
    ))
})

// Custom error handler middleware
app.use(errorHandler)

// Start server
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})