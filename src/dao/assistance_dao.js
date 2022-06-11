// Import custom assistances messages
const AssistanceMessages = require('../models/assistance_messages')

class AssistanceDAO {
    #table

    constructor() {
        this.#table = 'assistances'
    }

    /*
     * Creates a new assistance to the database.
     * @param {Number} userID - The ID of the user who is assisting.
     * @param {Number} eventID - The ID of the event the user is assisting.
    */
    async createAssistance(userID, eventID) {
        const existsAssistance = await this.getAssistanceOfUserForEvent(userID, eventID)

        // Check if user is already assisting to the event
        if (!existsAssistance) { 
            await global.connection.promise().query(
                'INSERT INTO ?? (user_id, event_id) VALUES (?, ?)',
                [this.#table, userID, eventID]
            )

            return AssistanceMessages.JOINED
        }

        return AssistanceMessages.ALREADY_JOINED
    }

    /*
     * Gets the assistance of a user for an event.
     * @param {Number} userID - The ID of the user who is assisting.
     * @param {Number} eventID - The ID of the event the user is assisting.
     * @returns {Promise} - The assistance of the user for the event.
    */
    async getAssistanceOfUserForEvent(userID, eventID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE user_id = ? AND event_id = ?',
            [this.#table, userID, eventID]
        )

        return results.length === 1 ? results[0] : null
    }

    /*
     * Edits the assistance of a user for an event.
     * @param {Object} assistance - The assistance of the user for the event.
     * @returns {Promise} - Notification message.
    */
    async editAssistance(assistance) {
        await global.connection.promise().query(
            'UPDATE ?? SET comment = ?, punctuation = ? WHERE user_id = ? AND event_id = ?',
            [this.#table, assistance.comment, assistance.punctuation, assistance.user_id, assistance.event_id]
        )

        return AssistanceMessages.RATED
    }

    /*
     * Deletes the assistance of a user for an event.
     * @param {Object} assistance - The assistance to delete.
     * @returns {Promise} - Notification message.
    */
    async deleteAssistance(assistance) {
        await global.connection.promise().query(
            'DELETE FROM ?? WHERE user_id = ? AND event_id = ?',
            [this.#table, assistance.user_id, assistance.event_id]
        )

        return AssistanceMessages.LEFT
    }

    /*
     * Gets all assistances for an event ID from the database.
     * @param {Number} id - The ID of the event to get the assistances for.
     * @returns {Promise} - Array of assistances
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

module.exports = AssistanceDAO