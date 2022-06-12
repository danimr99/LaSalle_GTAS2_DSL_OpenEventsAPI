// Import custom assistances messages
const AssistanceMessages = require('../models/assistance_messages')

class AssistanceDAO {
    constructor() {}

    /*
     * Creates a new assistance to the database.
     * @param {Number} userID - The ID of the user who is assisting.
     * @param {Number} eventID - The ID of the event the user is assisting.
     * @returns {Promise} comment - The comment of the user for the event.
    */
    async createAssistance(userID, eventID) {
        let existsAssistance = await this.getAssistanceOfUserForEvent(userID, eventID)
        existsAssistance = existsAssistance[0]

        // Check if user is already assisting to the event
        if (!existsAssistance) { 
            await global.connection.promise().query(
                'INSERT INTO assistances (user_id, event_id) VALUES (?, ?)',
                [userID, eventID]
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
        return await global.connection.promise().query(
            'SELECT * FROM assistances WHERE user_id = ? AND event_id = ?',
            [userID, eventID]
        )
    }

    /*
     * Edits the assistance of a user for an event.
     * @param {Object} assistance - The assistance of the user for the event.
     * @returns {Promise} - Notification message.
    */
    async editAssistance(assistance) {
        await global.connection.promise().query(
            'UPDATE assistances SET comment = ?, punctuation = ? WHERE user_id = ? AND event_id = ?',
            [assistance.comment, assistance.punctuation, assistance.user_id, assistance.event_id]
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
            'DELETE FROM assistances WHERE user_id = ? AND event_id = ?',
            [assistance.user_id, assistance.event_id]
        )

        return AssistanceMessages.LEFT
    }

    /*
     * Gets all users with their corresponding assistances for an event ID from the database.
     * @param {Number} eventID - The ID of the event to get the assistances for.
     * @returns {Promise} - Array of users with their assistance for the event.
    */
    async getEventAssistances(eventID) {
        return await global.connection.promise().query(
            'SELECT u.id, u.name, u.last_name, u.email, a.punctuation, a.comment ' +
            'FROM users AS u INNER JOIN assistances AS a ON u.id = a.user_id ' +
            'WHERE u.id IN (SELECT DISTINCT a2.user_id FROM assistances AS a2 ' +
            'WHERE a2.event_id = ?)',
            [eventID]
        )
    }

    /*
     * Gets the user and the assistance of user with matching ID for an event with matching ID.
     * @param {Number} eventID - The ID of the event to get the assistances for.
     * @param {Number} userID - The ID of the user to get the assistance for.
     * @returns {Promise} - User with his/her assistance for the event.
    */
    async getUserEventAssistance(eventID, userID) {
        return await global.connection.promise().query(
            'SELECT a.* FROM users AS u INNER JOIN assistances AS a ON u.id = a.user_id ' +
            'WHERE u.id IN (SELECT DISTINCT a2.user_id FROM assistances AS a2 ' +
            'WHERE a2.event_id = ? AND a2.user_id = ?)',
            [eventID, userID]
        )
    }
}

module.exports = AssistanceDAO