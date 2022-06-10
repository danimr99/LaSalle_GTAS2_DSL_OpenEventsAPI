/*
 * Gets the current date and time.
 * @returns {Date} - The current date and time.
*/
function getCurrentDateTime() {
    // Get current date time as UNIX timestamp
    const now = new Date().getTime()

    // Return current date time
    return new Date(now)
}

/*
 * Converts a date to a ISO 8601 string format.
 * @param {String} iso - The date to convert.
 * @returns {Date} - Converted date.
*/
function toDate(iso) {
    return new Date(iso)
}

/*
 * Converts a date to a ISO 8601 string format.
 * @param {Date} date - The date to convert.
 * @returns {String} - Converted date.
*/
function toISO(date) {
    // Return current date time as ISO 8601 string format
    return new Date(date).toISOString()
}

/*
 * Checks if a date is before another date.
 * @param {Date} beforeDate - The date to check.
 * @param {Date} afterDate - The date to check against.
 * @returns {Boolean} - True if the date is before the other date, false otherwise.
*/
function compareDates(beforeDate, afterDate) {
    return beforeDate < afterDate
}

module.exports = { getCurrentDateTime, toDate, toISO, compareDates }