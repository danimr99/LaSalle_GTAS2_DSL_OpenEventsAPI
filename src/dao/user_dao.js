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
}

module.exports = UserDAO