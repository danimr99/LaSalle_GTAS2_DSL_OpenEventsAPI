// Import password encryption
const { encryptPassword } = require('../utils/cypher')

class UserDAO {
    #table

    constructor() {
        this.#table = 'users'
    }

    /*
     * Registers a new user to the database.
     * @param {Object} user - User to be created.
    */
    async registerUser(user) {
        // Encrypt user password
        const encryptedPassword = await encryptPassword(user.password)

        await global.connection.promise().query(
            'INSERT INTO ?? (name, last_name, email, password, image) VALUES (?, ?, ?, ?, ?)',
            [this.#table, user.name, user.last_name, user.email, encryptedPassword, user.image]
        )
    }

    /*
     * Gets a user by email from the database.
     * @param {String} email - User email to be searched.
     * @returns {Promise} - A user.
    */
    async getUserByEmail(email) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE email LIKE ?',
            [this.#table, email]
        )

        return results
    }

    /*
     * Gets all users from the database.
     * @returns {Promise} - An array of users.
    */
    async getAllUsers() {
        const [results] = await global.connection.promise().query('SELECT * FROM ??', [this.#table])
        return results
    }

    /*
     * Gets a user by ID from the database.
     * @param {Number} id - User ID to be searched.
     * @returns {Promise} - A user.
    */
    async getUserByID(id) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE id = ?',
            [this.#table, id]
        )

        return results
    }

    /*
     * Gets users by name, last name or email address from the database.
     * @param {String} search - User name, last name or email address to be searched.
     * @returns {Promise} - An array of users.
    */
    async searchUsers(search) {
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE name LIKE CONCAT(\'%\', ?, \'%\') ' +
            'OR last_name LIKE CONCAT(\'%\', ?, \'%\') OR email LIKE CONCAT(\'%\', ?, \'%\')',
            [this.#table, search, search, search]
        )

        return results
    }

    /*
     * Edits a user in the database.
     * @param {Object} user - User ID to be edited.
    */
    async updateUser(user) {
        await global.connection.promise().query(
            'UPDATE ?? SET name = ?, last_name = ?, email = ?, password = ?, image = ? WHERE id = ?',
            [this.#table, user.name, user.last_name, user.email, user.password, user.image, user.id]
        )
    }

    /*
     * Deletes a user by ID from the database.
     * @param {Number} id - User ID to be deleted.
    */
    async deleteUserByID(id) {
        await global.connection.promise().query(
            'DELETE FROM ?? WHERE id = ?',
            [this.#table, id]
        )
    }

    /*
     * Gets the average score given by assistants of finished events created by a user.
     * @param {Number} id - User ID to be searched.
     * @returns {Promise} - Average score.
    */
    async getUserAverageScore(userID) {
        const eventsTable = 'events'
        const assistancesTable = 'assistances'

        const [results] = await global.connection.promise().query(
            'SELECT ROUND(AVG(a.punctuation), 2) AS average_score FROM ?? AS a WHERE a.event_id IN ' +
            '(SELECT DISTINCT e.id FROM ?? AS e WHERE e.owner_id = ?) AND a.punctuation IS NOT NULL',
            [assistancesTable, eventsTable, userID]
        )

        return results[0]['average_score']
    }

    /*
     * Gets the number of comments written by a user.
     * @param {Number} id - User ID to be searched.
     * @returns {Promise} - Number of comments written.
    */
    async getUserNumberOfComments(userID) {
        const assistancesTable = 'assistances'

        const [results] = await global.connection.promise().query(
            'SELECT COUNT(*) AS number_of_comments  FROM ?? AS a WHERE a.user_id = ? AND a.comment IS NOT NULL',
            [assistancesTable, userID]
        )

        return results[0]['number_of_comments']
    }

    /*
     * Gets the percentage of users with lower number of comments than the user.
     * @param {Number} id - User ID to be searched.
     * @returns {Promise} - Percentage of users with lower number of comments.
    */
    async getUserPercentageCommentersBelow(userID) {
        let numberOfCommenterBelow = 0

        // Get all users
        const allUsers = await this.getAllUsers()
        
        // Get number of comments of the user
        let userCommentsCount = await this.getUserNumberOfComments(userID)

        // Iterate through all users
        for (const user of allUsers) {
            // Check if user is not the user itself
            if (user.id !== userID) {
                // Get number of comments of the user
                let numberOtherUserComments = await this.getUserNumberOfComments(user.id)

                // Check if number of comments is lower than the user
                if (userCommentsCount > numberOtherUserComments) {
                    numberOfCommenterBelow++
                }
            }
        }

        // Calculate percentage
        const percentage = (numberOfCommenterBelow * 100) / allUsers.length
        
        return Math.round((percentage + Number.EPSILON) * 100) / 100
    }

}

module.exports = UserDAO