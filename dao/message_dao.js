class MessageDAO {
    constructor() {
        this.table = 'messages'
    }

    async createMessage(message) {
        // Insert message
        const [results] = await global.connection.promise().query(
            'INSERT INTO ?? (content, user_id_send, user_id_received, timestamp) VALUES (?, ?, ?, ?)',
            [this.table, message.content, message.user_id_send, message.user_id_received, message.timestamp]
        )

        return results
    }

    async getUserContacts(id) {
        // Set table name for the subquery
        const foreignTable = 'users'

        // Get all information of the users that has sent a message to a user
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? AS u ' +
                'WHERE u.id IN (SELECT DISTINCT m.user_id_send FROM ?? AS m ' + 
                    'WHERE m.user_id_received = ?)',
            [foreignTable, this.table, id]
        )

        return results
    }

    async getMessagesExchangedBetweenUsers(userID, externalUserID) {
        // Get all messages exchanged between users
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE (user_id_send = ? OR user_id_received = ?) ' + 
                'AND (user_id_send = ? OR user_id_received = ?)',
            [this.table, userID, userID, externalUserID, externalUserID]
        )

        return results
    }
}

module.exports = MessageDAO