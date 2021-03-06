// Import email address validator
const emailValidator = require('@sideway/address')

// Set password minimum length
const PASSWORD_MIN_LENGTH = 8

// Set event punctuation minimum value
const EVENT_PUNCTUATION_MIN = 0
const EVENT_PUNCTUATION_MAX = 10


/*
 * Checks if an object has all the properties correctly fulfilled (not null, undefined or empty). 
 * @param {Object} object - The object to check.
 * @returns {Array} - An array containing the names of the properties that are not fulfilled.
*/
function validateObject(object) {
    let incompletedFields = []

    Object.entries(object).map(entry => {
        if(entry[1] == null || entry[1] === '') {
            incompletedFields.push(entry[0])
        }
    })

    return incompletedFields
}

/*
 * Checks if an email address is valid.
 * @param {String} email - The email address to check.
 * @returns {Boolean} - True if the email address is valid, false otherwise.
*/
function validateEmail(email) {
    return emailValidator.isEmailValid(email)
}

/*
 * Checks if a password length is valid.
 * @param {String} password - The password to check.
 * @returns {Boolean} - True if the password is valid, false otherwise.
*/
function validatePassword(password) {
    return password.length >= PASSWORD_MIN_LENGTH
}

/*
 * Checks if a date time string is valid.
 * @param {String} dateTimeString - The date time string to check.
 * @returns {Boolean} - True if the date time string is valid, false otherwise.
*/
function validateDateTimeString(dateTimeString) {
    return isNaN(Date.parse(dateTimeString)) ? false : true
}

/*
 * Checks if a value is a number.
 * @param {String} number - The value to check.
 * @returns {Boolean} - True if the value is a number, false otherwise.
*/
function validateNumber(number) {
    return !isNaN(number)
}

/*
 * Checks if an event punctuation value is valid.
 * @param {String} number - The value to check.
 * @returns {Boolean} - True if the value is a number, false otherwise.
*/
function validatePunctuation(punctuation) {
    if(!validateNumber(punctuation)) {
        return false
    }

    return punctuation >= EVENT_PUNCTUATION_MIN && punctuation <= EVENT_PUNCTUATION_MAX
}

module.exports = { 
    validateObject,
    validateEmail, 
    validatePassword, 
    validateDateTimeString,
    validateNumber,
    validatePunctuation,
    PASSWORD_MIN_LENGTH 
}