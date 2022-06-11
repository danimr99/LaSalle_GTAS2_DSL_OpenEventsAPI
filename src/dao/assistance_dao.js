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
}

module.exports = AssistanceDAO