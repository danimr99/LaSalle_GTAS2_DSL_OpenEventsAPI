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

// Middlewares
app.use(morgan('tiny'))
app.use(helmet())
app.use(express.json())

// Start server
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})