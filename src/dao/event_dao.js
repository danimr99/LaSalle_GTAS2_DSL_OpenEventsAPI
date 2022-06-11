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
    async getEventById(id) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE id = ?',
            [this.#table, id]
        )

        return results.length === 1 ? results[0] : null
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
     * Gets all assistances for an event ID from the database.
     * @param {Number} id - The ID of the event to get the assistances for.
    */
    // TODO: Use this function to get the assistances of an event
    async getEventAssistances(id) {
        const foreignTable = 'assistances'

        const [results] = global.connection.promise().query(
            'SELECT u.id, u.name, u.last_name, u.email, a.punctuation, a.comment ' +
            'FROM ?? AS u INNER JOIN ?? AS a ' +
            'WHERE u.id IN (SELECT DISTINCT a2.user_id FROM ?? AS a2 ' +
            'WHERE a2.event_id = ?)',
            [this.#table, foreignTable, foreignTable, id]
        )

        return results
    }
}

module.exports = EventDAO