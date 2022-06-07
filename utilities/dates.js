function getCurrentDateTime() {
    // Get current date time as UNIX timestamp
    const now = new Date().getTime()

    // Return current date time
    return new Date(now)
}

function toDate(iso) {
    return new Date(iso)
}

function toISO(date) {
    // Return current date time as ISO 8601 string format
    return new Date(date).toISOString()
}

function compareDates(beforeDate, afterDate) {
    return beforeDate < afterDate
}

module.exports = { getCurrentDateTime, toDate, toISO, compareDates }