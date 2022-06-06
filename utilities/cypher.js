// Import library to encrypt a password
const bcrypt = require('bcrypt')

// Password encryption configuration
const saltRounds = 10

async function encryptPassword(password) {
    const salt = await bcrypt.genSalt(saltRounds)
    return await bcrypt.hash(password, salt)
}

async function checkPassword(passwordPlainText, passwordHash) {
    return await bcrypt.compare(passwordPlainText, passwordHash)
}

module.exports = { encryptPassword, checkPassword }