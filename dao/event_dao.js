const GenericDAO = require('./generic_dao')

class EventDAO extends GenericDAO {
    constructor() {
        super('events')
    }
}

module.exports = EventDAO