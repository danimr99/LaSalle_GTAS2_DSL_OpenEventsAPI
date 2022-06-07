const GenericDAO = require('./generic_dao')

class EventDAO extends GenericDAO {
    constructor() {
        super('events')
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

    async getEventById(id) {
        // Get event by id
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE id = ?',
            [this.table, id]
        )

        return results
    }
}

module.exports = EventDAO