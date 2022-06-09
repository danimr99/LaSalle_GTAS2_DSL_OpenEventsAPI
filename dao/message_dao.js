class MessageDAO {
    #table

    constructor() {
        this.#table = 'messages'
    }

    /*
     * Creates a new message to the database.
     * @param {Object} message - The message to be created.
    */
    async createMessage(message) {
        await global.connection.promise().query(
            'INSERT INTO ?? (content, user_id_send, user_id_received, timestamp) VALUES (?, ?, ?, ?)',
            [this.#table, message.content, message.user_id_send, message.user_id_received, message.timestamp]
        )
    }

    /*
     * Gets all users that have messaged the authenticated user.
     * @param {Number} id - The ID of the authenticated user.
     * @returns {Promise} - An array of users.
    */
    async getUserContacts(id) {
        // Set table name for the subquery
        const foreignTable = 'users'

        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? AS u ' +
                'WHERE u.id IN (SELECT DISTINCT m.user_id_send FROM ?? AS m ' + 
                    'WHERE m.user_id_received = ?)',
            [foreignTable, this.#table, id]
        )

        return results
    }

    /*
     * Gets all messages sent between the authenticated user and a specific user.
     * @param {Number} userID - The ID of the authenticated user.
     * @param {Number} externalUserID - The ID of the external user.
     * @returns {Promise} - An array of messages.
    */
    async getMessagesExchangedBetweenUsers(userID, externalUserID) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE (user_id_send = ? OR user_id_received = ?) ' + 
                'AND (user_id_send = ? OR user_id_received = ?)',
            [this.#table, userID, userID, externalUserID, externalUserID]
        )

        return results
    }
}

module.exports = MessageDAO