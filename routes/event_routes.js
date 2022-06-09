// Import Express and create a router
const express = require('express')
const router = express.Router()

// Import HTTP status codes
const HttpStatusCodes = require('../models/http_status_codes')

// Import EventDAO and create an instance
const EventDAO = require('../dao/event_dao')
const eventDAO = new EventDAO()

// Import custom date time handler
const Dates = require('../utilities/dates')

// Import custom error 
const ErrorAPI = require('../errors/error_api')

// Import custom authenticator
const { authenticateUser } = require('../utilities/authenticator')

// Import custom data validators
const { validateObject, validateDateTimeString, validateNumber } = require('../utilities/validator')


/*
 * Creates an event.
 * HTTP Method: POST
 * Endpoint: "/events"
*/
router.post('/', authenticateUser, async (req, res, next) => {
    // Get user ID of the creator of the event using its authentication token
    const eventOwnerID = req.USER_ID

    // Get event information from request body and set extra data
    const event = {
        name: req.body.name,
        image: req.body.image,
        location: req.body.location,
        description: req.body.description,
        eventStart_date: req.body.eventStart_date,
        eventEnd_date: req.body.eventEnd_date,
        n_participators: req.body.n_participators,
        type: req.body.type,
        owner_id: eventOwnerID,
        date: Dates.getCurrentDateTime()
    }

    // Check if all event fields are correctly fulfilled
    const invalidEventFields = validateObject(event)
    const isEventFilled = invalidEventFields.length === 0 ? true : false

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': event
    }

    // Handle event not correctly filled error
    if (!isEventFilled) {
        stacktrace['invalid_event_fields'] = invalidEventFields

        return next(new ErrorAPI(
            'All event information must be correctly fulfilled',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Check if event start and end dates are valid dates
    const isValidStartDate = validateDateTimeString(event.eventStart_date)
    const isValidEndDate = validateDateTimeString(event.eventEnd_date)

    // Handle invalid event dates error
    if (!isValidStartDate || !isValidEndDate) {
        stacktrace['invalid_dates'] = []

        if (!isValidStartDate)
            stacktrace['invalid_dates'].push({ event_start_date: event.eventStart_date })

        if (!isValidStartDate)
            stacktrace['invalid_dates'].push({ event_end_date: event.eventEnd_date })

        return next(new ErrorAPI(
            'Event dates are not a valid date format',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }


    // Check if start date is before end date
    if (!Dates.compareDates(event.eventStart_date, event.eventEnd_date)) {
        stacktrace['event_dates'] = {
            'start_date': event.eventStart_date,
            'end_date': event.eventEnd_date
        }

        return next(new ErrorAPI(
            'Event start date must be before event end date',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Create event on the database
    try {
        await eventDAO.createEvent(event)
    } catch (error) {
        // Handle error on create event to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while inserting an event to the database',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.CREATED).json(event)
})

/*
 * Gets all future events.
 * HTTP Method: GET
 * Endpoint: "/events"
*/
router.get('/', authenticateUser, async (_req, res, next) => {
    // Get all events
    let events

    try {
        events = await eventDAO.getAllEvents()
    } catch (error) {
        // Handle error while fetching all events from database
        let stacktrace = {
            'error_sql': error
        }

        return next(new ErrorAPI(
            'An error has occurred while fetching all events from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Remove events that are not from the future (event start date > current date time)
    events = events.filter(
        event => Dates.compareDates(Dates.getCurrentDateTime(), Dates.toDate(event.eventStart_date))
    )

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Searches events with location, keyword in name, or date containing or matching the values of the query
 * parameters.
 * HTTP Method: GET
 * Endpoint: "/events/search"
 * Query: 
 *      location => Type: String => Text to to be contained on the event location
 *      keyword  => Type: String => Text to be contained on the event name
 *      date     => Type: String => Date to match the start and end event's date
*/
router.get('/search', authenticateUser, async (req, res, next) => {
    // Get query parameters from URL path sent as query
    const { location, keyword, date } = req.query

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'location': location,
            'keyword': keyword,
            'date': date
        }
    }

    // Get all events from database
    let events

    try {
        events = await eventDAO.getAllEvents()
    } catch (error) {
        // Handle error while fetching all events from database
        stacktrace['error_sql'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching all events from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Filter by query parameters
    events = events.filter(
        event => {
            // Split dates and times for event dates
            const [startDate, startTime] = Dates.toISO(event.eventStart_date).split('T')
            const [endDate, endTime] = Dates.toISO(event.eventEnd_date).split('T')

            return event.name.includes(keyword) || event.location.includes(location) ||
                startDate.includes(date) || startTime.includes(date) ||
                endDate.includes(date) || endTime.includes(date)
        }
    )

    // Send response
    res.status(HttpStatusCodes.OK).json(events)
})

/*
 * Gets event by ID.
 * HTTP Method: GET
 * Endpoint: "/events/{id}"
*/
router.get('/:id', authenticateUser, async (req, res, next) => {
    // Get event ID from the URL path sent as parameter
    const { id } = req.params

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'event_id': id
        }
    }

    // Check if event ID is a number
    if (!validateNumber(id)) {
        stacktrace['error'] = {
            'reason': 'Event ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid event ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get event by id from database
    let event

    try {
        event = await eventDAO.getEventById(id)
    } catch (error) {
        // Handle error on get event by id from database
        stacktrace['error_sql'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching an event by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json(event)
})

/*
 * Edits specified fields of the event with matching ID.
 * HTTP Method: PUT
 * Endpoint: "/events/{id}"
*/
router.put('/:id', authenticateUser, async (req, res, next) => {
    // Get event ID from the URL path sent as parameter
    const { id } = req.params

    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'event_id': id,
            'user_id': USER_ID
        }
    }

    // Check if event ID is a number
    if (!validateNumber(id)) {
        stacktrace['error'] = {
            'reason': 'Event ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid event ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get event information by ID from database
    let event

    try {
        event = await eventDAO.getEventById(id)
    } catch (error) {
        // Handle error on fetching event by ID from the database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching an event by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if exists event matching ID
    if (!event) {
        return next(new ErrorAPI(
            'Event does not exist or was not found',
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Check if user ID matches with the owner ID
    if (USER_ID !== event.owner_id) {
        stacktrace['error'] = {
            'owner_id': event.owner_id
        }

        return next(new ErrorAPI(
            'An event can only be modified by the owner of itself',
            HttpStatusCodes.FORBIDDEN,
            stacktrace
        ))
    }

    // Update event depending on the fields received
    if (req.body.name) event.name = req.body.name
    if (req.body.image) event.image = req.body.image
    if (req.body.location) event.location = req.body.location
    if (req.body.description) event.description = req.body.description
    if (req.body.eventStart_date) event.eventStart_date = req.body.eventStart_date
    if (req.body.eventEnd_date) event.eventEnd_date = req.body.eventEnd_date
    if (req.body.n_participators) event.n_participators = req.body.n_participators
    if (req.body.type) event.type = req.body.type

    // Set received data to error stacktrace
    stacktrace = {
        '_original': event
    }

    // Update event information to database
    try {
        await eventDAO.updateEvent(event)
    } catch (error) {
        // Handle error on update event to database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while updating an event to the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    delete event.id
    res.status(HttpStatusCodes.OK).json(event)
})

/*
 * Deletes event with matching ID.
 * HTTP Method: DELETE
 * Endpoint: "/events/{id}"
*/
router.delete('/:id', authenticateUser, async (req, res, next) => {
    // Get event ID from the URL path sent as parameter
    const { id } = req.params

    // Get user ID from the authentication token
    const { USER_ID } = req

    // Set received data to error stacktrace
    let stacktrace = {
        '_original': {
            'event_id': id,
            'user_id': USER_ID
        }
    }

    // Check if event ID is a number
    if (!validateNumber(id)) {
        stacktrace['error'] = {
            'reason': 'Event ID is not a number'
        }

        return next(new ErrorAPI(
            'Invalid event ID',
            HttpStatusCodes.BAD_REQUEST,
            stacktrace
        ))
    }

    // Get event matching ID if exists
    let event

    try {
        event = await eventDAO.getEventById(id)
    } catch (error) {
        // Handle error on fetch event by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while fetching an event by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Check if exists event matching ID
    if (!event) {
        return next(new ErrorAPI(
            'Event does not exist or was not found',
            HttpStatusCodes.NOT_FOUND,
            stacktrace
        ))
    }

    // Check if user ID matches with the owner ID
    if (USER_ID !== event.owner_id) {
        stacktrace['error'] = {
            'owner_id': event.owner_id
        }

        return next(new ErrorAPI(
            'An event can only be deleted by the owner of itself',
            HttpStatusCodes.FORBIDDEN,
            stacktrace
        ))
    }

    // Delete event by ID and its assistances from database
    try {
        await eventDAO.deleteEvent(id)
        // TODO Delete all its relations (assistances)
    } catch (error) {
        // Handle error on delete event by id from database
        stacktrace['sql_error'] = error

        return next(new ErrorAPI(
            'An error has occurred while deleting an event by ID from the database',
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
            stacktrace
        ))
    }

    // Send response
    res.status(HttpStatusCodes.OK).json({
        'message': `Event with ID ${id} has been deleted successfully`
    })
})

module.exports = router