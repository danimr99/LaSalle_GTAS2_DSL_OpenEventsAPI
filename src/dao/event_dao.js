class EventDAO {
    #table

    constructor() {
        this.#table = 'events'
    }

    /*
     * Creates a new event to the database.
     * @param {Object} event - The event to be created.
     * @returns {Promise} - Friend request message informing the user about the result of the operation
    */
    async createEvent(event) {
        // Deconstruct event object
        const { name, owner_id, date, image, location, description, eventStart_date, 
            eventEnd_date, n_participators, type } = event

        // Insert event into database
        await global.connection.promise().query(
            'INSERT INTO ?? (name, owner_id, date, image, location, description, eventStart_date, eventEnd_date,'
            + ' n_participators, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [this.#table, name, owner_id, date, image, location, description, eventStart_date, 
                eventEnd_date, n_participators, type]
        )
    }

    /*
     * Gets all events from the database.
     * @returns {Promise} - Array of events
    */
    async getAllEvents() {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ??', 
            [this.#table]
        )
        
        return results
    }

    /*
     * Gets an event by ID from the database.
     * @param {Number} id - The ID of the event to be retrieved.
     * @returns {Promise} - Event
    */
    async getEventByID(id) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE id = ?',
            [this.#table, id]
        )

        return results
    }

    /*
     * Edits an event from the database.
     * @param {Object} event - Event with edited information.
    */
    async updateEvent(event) {
        await global.connection.promise().query(
            'UPDATE ?? SET name = ?, image = ?, location = ?, description = ?, eventStart_date = ?, eventEnd_date = ?,' + 
            ' n_participators = ?, type = ? WHERE id = ?',
            [this.#table, event.name, event.image, event.location, event.description, event.eventStart_date, 
                event.eventEnd_date, event.n_participators, event.type, event.id]
        )
    }

    /*
     * Deletes an event by ID from the database.
     * @param {Number} id - The ID of the event to be deleted.
    */
    async deleteEvent(id) {
        await global.connection.promise().query(
            'DELETE FROM ?? WHERE id = ?',
            [this.#table, id]
        )
    }

    /*
     * Gets all events of a user from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE owner_id = ?',
            [this.#table, userID]
        )

        return results
    }

    /*
     * Gets all future events of a user from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getFutureEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE owner_id = ? AND eventStart_date > NOW()',
            [this.#table, userID]
        )

        return results
    }

    /*
     * Gets all finished events of a user from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getFinishedEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE owner_id = ? AND eventEnd_date < NOW()',
            [this.#table, userID]
        )

        return results
    }

    /*
     * Gets all active events of a user from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events
    */
    async getActiveEventsCreatedByUser(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE owner_id = ? AND eventStart_date < NOW() AND eventEnd_date > NOW()',
            [this.#table, userID]
        )

        return results
    }

    /*
     * Gets all the events that a user is attending from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events with the user rating.
    */
    async getAssistancesByUser(userID) {
        const foreignTable = 'assistances'

        const [results] = await global.connection.promise().query(
            'SELECT e.*, a.punctuation, a.comment FROM ?? AS e INNER JOIN ?? AS a ON e.id = a.event_id' +
            'WHERE a.user_id = ?',
            [this.#table, foreignTable, userID]
        )

        return results
    }

    /*
     * Gets all the future events that a user is attending from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events with the user rating.
    */
    async getFutureAssistancesByUser(userID) {
        const foreignTable = 'assistances'

        const [results] = await global.connection.promise().query(
            'SELECT e.*, a.punctuation, a.comment FROM ?? AS e INNER JOIN ?? AS a ON e.id = a.event_id ' +
            'WHERE a.user_id = ? AND e.eventStart_date > NOW()',
            [this.#table, foreignTable, userID]
        )

        return results
    }

    /*
     * Gets all the finished events that a user has attended from the database.
     * @param {Number} id - The ID of the user to get the events for.
     * returns {Promise} - Array of events with the user rating.
    */
    async getFinishedAssistancesByUser(userID) {
        const foreignTable = 'assistances'

        const [results] = await global.connection.promise().query(
            'SELECT e.*, a.punctuation, a.comment FROM ?? AS e INNER JOIN ?? AS a ON e.id = a.event_id ' +
            'WHERE a.user_id = ? AND e.eventEnd_date < NOW()',
            [this.#table, foreignTable, userID]
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
            'SELECT * FROM ?? WHERE eventEnd_date > NOW()',
            [this.#table]
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