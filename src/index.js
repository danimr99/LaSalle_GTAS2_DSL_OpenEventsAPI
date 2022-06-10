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

// Custom routes
const userRoutes = require('./routes/user_routes')
const eventRoutes = require('./routes/event_routes')
const assistanceRoutes = require('./routes/assistance_routes')
const messageRoutes = require('./routes/message_routes')
const friendRoutes = require('./routes/friend_routes')

// Custom error and handler
const ErrorAPI = require('./errors/error_api')
const { errorHandler } = require('./errors/error_handler')


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

    next(new ErrorAPI(
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