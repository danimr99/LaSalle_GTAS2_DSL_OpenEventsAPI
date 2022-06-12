class EventDAO {
    constructor() {}

    /*
     * Creates a new event to the database.
     * @param {Object} event - The event to be created.
     * @returns {Promise} - Friend request message informing the user about the result of the operation
    */
    async createEvent(event) {
        await global.connection.promise().query(
            'INSERT INTO events (name, owner_id, date, image, location, description, eventStart_date, eventEnd_date,'
            + ' n_participators, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [event.name, event.owner_id, event.date, event.image, event.location, event.description, 
                event.eventStart_date, event.eventEnd_date, event.n_participators, event.type]
        )
    }

    /*
     * Gets all events from the database.
     * @returns {Promise} - Array of events
    */
    async getAllEvents() {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM events'
        )

        return results
    }

    /*
     * Gets an event by ID from the database.
     * @param {Number} eventID - The ID of the event to be retrieved.
     * @returns {Promise} - Event
    */
    async getEventByID(eventID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM events WHERE id = ?',
            [eventID]
        )

        return results
    }

    /*
     * Edits an event from the database.
     * @param {Object} event - Event with edited information.
    */
    async updateEvent(event) {
        await global.connection.promise().query(
            'UPDATE events SET name = ?, image = ?, location = ?, description = ?, eventStart_date = ?, eventEnd_date = ?,' + 
            ' n_participators = ?, type = ? WHERE id = ?',
            [event.name, event.image, event.location, event.description, event.eventStart_date, 
                event.eventEnd_date, event.n_participators, event.type, event.id]
        )
    }

    /*
     * Deletes an event by ID from the database.
     * @param {Number} eventID - The ID of the event to be deleted.
    */
    async deleteEvent(eventID) {
        await global.connection.promise().query(
            'DELETE FROM events WHERE id = ?',
            [eventID]
        )
    }

    /*
     * Gets all events of a user from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM events WHERE owner_id = ?',
            [userID]
        )

        return results
    }

    /*
     * Gets all future events of a user from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getFutureEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM events WHERE owner_id = ? AND eventStart_date > NOW()',
            [userID]
        )

        return results
    }

    /*
     * Gets all finished events of a user from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getFinishedEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM events WHERE owner_id = ? AND eventEnd_date < NOW()',
            [userID]
        )

        return results
    }

    /*
     * Gets all active events of a user from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getActiveEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM events WHERE owner_id = ? AND eventStart_date < NOW() AND eventEnd_date > NOW()',
            [userID]
        )

        return results
    }

    /*
     * Gets all the events that a user is attending from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events with the user rating.
    */
    async getAssistancesByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT e.*, a.punctuation, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
            'WHERE a.user_id = ?',
            [userID]
        )

        return results
    }

    /*
     * Gets all the future events that a user is attending from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events with the user rating.
    */
    async getFutureAssistancesByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT e.*, a.punctuation, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
            'WHERE a.user_id = ? AND e.eventStart_date > NOW()',
            [userID]
        )

        return results
    }

    /*
     * Gets all the finished events that a user has attended from the database.
     * @param {Number} userID - The ID of the user to get the events for.
     * returns {Promise} - Array of events with the user rating.
    */
    async getFinishedAssistancesByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT e.*, a.punctuation, a.comment FROM events AS e INNER JOIN assistances AS a ON e.id = a.event_id ' +
            'WHERE a.user_id = ? AND e.eventEnd_date < NOW()',
            [userID]
        )

        return results
    }

    /*
     * Gets all the future events ordered by descending owner average score from the database.
     * returns {Promise} - Array of events.
    */
    async getBestEvents() {
        let bestEvents = []

        // Get average score for each event owner
        const [ownersAverageScores] = await global.connection.promise().query(
            'SELECT (AVG(a.punctuation)) AS average_score, e.owner_id FROM assistances AS a, events AS e, users AS u ' +
            'WHERE e.owner_id = u.id AND e.id = a.event_id AND e.eventEnd_Date < NOW() GROUP BY e.owner_id ' + 
            'ORDER BY average_score DESC'
        )

        // Get all events with the highest average score
        const [futureEvents] = await global.connection.promise().query(
            'SELECT * FROM events WHERE eventEnd_date > NOW()'
        )

        // Iterate through all future events
        futureEvents.forEach(event => {
            // Iterate through all owners average scores
            ownersAverageScores.forEach(owner => {
                // If the owner has the highest average score
                if (event.owner_id == owner.owner_id) {
                    // Add the event to the best events array
                    bestEvents.push(event)
                }
            })
        })

        return bestEvents
    }
}

module.exports = EventDAO