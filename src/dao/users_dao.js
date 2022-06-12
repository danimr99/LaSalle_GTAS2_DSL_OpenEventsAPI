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
            'INSERT INTO users (name, last_name, email, password, image) VALUES (?, ?, ?, ?, ?)',
            [user.name, user.last_name, user.email, encryptedPassword, user.image]
        )
    }

    /*
     * Gets a user by email from the database.
     * @param {String} email - User email to be searched.
     * @returns {Promise} - A user.
    */
    async getUserByEmail(email) {
        return await global.connection.promise().query(
            'SELECT * FROM users WHERE email LIKE ?',
            [email]
        )
    }

    /*
     * Gets all users from the database.
     * @returns {Promise} - An array of users.
    */
    async getAllUsers() {
        return await global.connection.promise().query('SELECT * FROM users')
    }

    /*
     * Gets a user by ID from the database.
     * @param {Number} userID - User ID to be searched.
     * @returns {Promise} - A user.
    */
    async getUserByID(userID) {
        return await global.connection.promise().query(
            'SELECT * FROM users WHERE id = ?',
            [userID]
        )
    }

    /*
     * Gets users by name, last name or email address from the database.
     * @param {String} search - User name, last name or email address to be searched.
     * @returns {Promise} - An array of users.
    */
    async searchUsers(search) {
        return await global.connection.promise().query(
            'SELECT * FROM users WHERE name LIKE CONCAT(\'%\', ?, \'%\') ' +
            'OR last_name LIKE CONCAT(\'%\', ?, \'%\') OR email LIKE CONCAT(\'%\', ?, \'%\')',
            [search, search, search]
        )
    }

    /*
     * Edits a user in the database.
     * @param {Object} user - User ID to be edited.
    */
    async updateUser(user) {
        await global.connection.promise().query(
            'UPDATE users SET name = ?, last_name = ?, email = ?, password = ?, image = ? WHERE id = ?',
            [user.name, user.last_name, user.email, user.password, user.image, user.id]
        )
    }

    /*
     * Deletes a user by ID from the database.
     * @param {Number} userID - User ID to be deleted.
    */
    async deleteUserByID(userID) {
        await global.connection.promise().query(
            'DELETE FROM users WHERE id = ?',
            [userID]
        )
    }

    /*
     * Gets the average score given by assistants of finished events created by a user.
     * @param {Number} userID - User ID to be searched.
     * @returns {Promise} - Average score.
    */
    async getUserAverageScore(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT ROUND(AVG(a.punctuation), 2) AS average_score FROM assistances AS a WHERE a.event_id IN ' +
            '(SELECT e.id FROM events AS e WHERE e.owner_id = ?) AND a.punctuation IS NOT NULL',
            [userID]
        )

        return results[0]['average_score']
    }

    /*
     * Gets the number of comments written by a user.
     * @param {Number} userID - User ID to be searched.
     * @returns {Promise} - Number of comments written.
    */
    async getUserNumberOfComments(userID) {
        const [results] = await global.connection.promise().query(
            'SELECT COUNT(*) AS number_of_comments FROM assistances AS a WHERE a.user_id = ? AND a.comment IS NOT NULL',
            [userID]
        )

        return results[0]['number_of_comments']
    }

    /*
     * Gets the percentage of users with lower number of comments than the user.
     * @param {Number} userID - User ID to be searched.
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