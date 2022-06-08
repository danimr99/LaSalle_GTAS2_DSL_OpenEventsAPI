class EventDAO {
    constructor() {
        this.table = 'events'
    }

    async createEvent(event) {
        // Deconstruct event object
        const { name, owner_id, date, image, location, description, eventStart_date, 
            eventEnd_date, n_participators, type } = event

        // Insert event into database
        const [results] = await global.connection.promise().query(
            'INSERT INTO ?? (name, owner_id, date, image, location, description, eventStart_date, eventEnd_date,'
            + ' n_participators, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [this.table, name, owner_id, date, image, location, description, eventStart_date, 
                eventEnd_date, n_participators, type]
        )

        return results
    }

    async getAllEvents() {
        const [results] = await global.connection.promise().query('SELECT * FROM ??', [this.table])
        return results
    }

    async getEventById(id) {
        // Get event by id
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE id = ?',
            [this.table, id]
        )

        return results
    }

    async updateEvent(event) {
        // Update event to the database
        const [results] = await global.connection.promise().query(
            'UPDATE ?? SET name = ?, image = ?, location = ?, description = ?, eventStart_date = ?, eventEnd_date = ?,' + 
            ' n_participators = ?, type = ? WHERE id = ?',
            [this.table, event.name, event.image, event.location, event.description, event.eventStart_date, 
                event.eventEnd_date, event.n_participators, event.type, event.id]
        )

        return results
    }

    async deleteEvent(id) {
        // Delete event to the database
        const [results] = await global.connection.promise().query(
            'DELETE FROM ?? WHERE id = ?',
            [this.table, id]
        )

        return results
    }
}

module.exports = EventDAO