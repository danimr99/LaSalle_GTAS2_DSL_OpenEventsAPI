class GenericDAO {
    constructor(table) {
        this.table = table
    }

    async getAll() {
        const [results] = await global.connection.promise().query('SELECT * FROM ??', [this.table])
        return results
    }
}

module.exports = GenericDAO