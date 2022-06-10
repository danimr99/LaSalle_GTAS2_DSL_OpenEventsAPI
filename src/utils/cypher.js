// Import library to encrypt a password
const bcrypt = require('bcrypt')

// Password encryption configuration
const saltRounds = 10


/*
 * Encrypts a password.
 * @param {String} password - The password to encrypt.
*/
async function encryptPassword(password) {
    const salt = await bcrypt.genSalt(saltRounds)
    return await bcrypt.hash(password, salt)
}

/*
 * Compares a password with an encrypted password.
 * @param {String} passwordPlainText - The password to compare.
 * @param {String} passwordHash - The encrypted password to compare.
 * @returns {Boolean} - True if the passwords match, false otherwise.
*/
async function checkPassword(passwordPlainText, passwordHash) {
    return await bcrypt.compare(passwordPlainText, passwordHash)
}

module.exports = { encryptPassword, checkPassword }