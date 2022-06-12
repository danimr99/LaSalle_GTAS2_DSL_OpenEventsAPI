class MessageDAO {
    constructor() {}

    /*
     * Creates a new message to the database.
     * @param {Object} message - The message to be created.
    */
    async createMessage(message) {
        await global.connection.promise().query(
            'INSERT INTO messages (content, user_id_send, user_id_received, timestamp) VALUES (?, ?, ?, ?)',
            [message.content, message.user_id_send, message.user_id_received, message.timestamp]
        )
    }

    /*
     * Gets all users that have messaged the authenticated user.
     * @param {Number} authenticatedUserID - The ID of the authenticated user.
     * @returns {Promise} - An array of users.
    */
    async getUserContacts(authenticatedUserID) {
        return await global.connection.promise().query(
            'SELECT * FROM users AS u ' +
            'WHERE u.id IN (SELECT DISTINCT m.user_id_send FROM messages AS m ' + 
            'WHERE m.user_id_received = ?)',
            [authenticatedUserID]
        )
    }

    /*
     * Gets all messages sent between the authenticated user and a specific user.
     * @param {Number} userID - The ID of the authenticated user.
     * @param {Number} externalUserID - The ID of the external user.
     * @returns {Promise} - An array of messages.
    */
    async getMessagesExchangedBetweenUsers(userID, externalUserID) {
        return await global.connection.promise().query(
            'SELECT * FROM messages WHERE (user_id_send = ? OR user_id_received = ?) ' + 
            'AND (user_id_send = ? OR user_id_received = ?)',
            [userID, userID, externalUserID, externalUserID]
        )
    }
}

module.exports = MessageDAO