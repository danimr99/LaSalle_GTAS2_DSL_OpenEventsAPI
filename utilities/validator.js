// Import email address validator
const emailValidator = require('@sideway/address')

// Set password minimum length
const passwordMinLength = 8

function validateObject(object) {
    let incompletedFields = []

    Object.entries(object).map(entry => {
        if(entry[1] == null || entry[1] === '') {
            incompletedFields.push(entry[0])
        }
    })

    return incompletedFields
}

function validateEmail(email) {
    return emailValidator.isEmailValid(email)
}

function validatePassword(password) {
    return password.length >= passwordMinLength
}

function validateDateTimeString(dateTimeString) {
    return isNaN(Date.parse(dateTimeString)) ? false : true
}

function validateNumber(number) {
    return !isNaN(number)
}

module.exports = { 
    validateObject,
    validateEmail, 
    validatePassword, 
    validateDateTimeString,
    validateNumber,
    passwordMinLength 
}