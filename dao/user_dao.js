const GenericDAO = require('./generic_dao')

// Import password encryption
const { encryptPassword } = require('../utilities/cypher')

class UserDAO extends GenericDAO {
    constructor() {
        super('users')
    }

    async registerUser(user) {
        // Encrypt user password
        const encryptedPassword = await encryptPassword(user.password)

        // Insert user into database
        const [results] = await global.connection.promise().query(
            'INSERT INTO ?? (name, last_name, email, password, image) VALUES (?, ?, ?, ?, ?)',
            [this.table, user.name, user.last_name, user.email, encryptedPassword, user.image]
        )

        return results
    }

    async getUserByEmail(email) {
        // Select user matching email
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE email LIKE ?',
            [this.table, email]
        )

        return results
    }

    async getUserByID(id) {
        // Select user matching id
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE id = ?',
            [this.table, id]
        )

        return results
    }

    async searchUsers(search) {
        // Select user matching id
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE name LIKE CONCAT(\'%\', ?, \'%\') ' + 
            'OR last_name LIKE CONCAT(\'%\', ?, \'%\') OR email LIKE CONCAT(\'%\', ?, \'%\')',
            [this.table, search, search, search]
        )

        return results
    }

    async updateUser(user) {
        // Update user matching id
        const [results] = await global.connection.promise().query(
            'UPDATE ?? SET name = ?, last_name = ?, email = ?, password = ?, image = ? WHERE id = ?',
            [this.table, user.name, user.last_name, user.email, user.password, user.image, user.id]
        )

        return results
    }

    async deleteUserByID(id) {
        // Delete user matching id
        const [results] = await global.connection.promise().query(
            'DELETE FROM ?? WHERE id = ?',
            [this.table, id]
        )

        return results
    }
}

module.exports = UserDAO