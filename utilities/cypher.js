// Import library to encrypt a password
const bcrypt = require('bcrypt')

// Password encryption configuration
const saltRounds = 10

function encryptPassword(password) {
    const salt = bcrypt.genSaltSync(saltRounds)
    return bcrypt.hashSync(password, salt)
}

async function checkPassword(passwordPlainText, passwordHash) {
    return await bcrypt.compare(passwordPlainText, passwordHash)
}

module.exports = { encryptPassword, checkPassword }