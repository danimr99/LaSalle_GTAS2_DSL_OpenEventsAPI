// Import custom friend request status and messages
const [FriendRequestStatus, FriendRequestMessages] = require('../models/friend_request')

class FriendDAO {
    #table

    constructor() {
        this.#table = 'friends'
    }

    /*
     * Get all users that have sent a friend request to user ID and the friend request status is pending.
     * @param {number} id - User ID
     * @returns {Promise<Array>} - Array of users
    */
    async getPotentialFriends(id) {
        const externalTable = 'users'

        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? AS u ' +
            'WHERE u.id IN (SELECT user_id FROM ?? AS f WHERE f.user_id_friend = ? AND f.status = ?)',
            [externalTable, this.#table, id, FriendRequestStatus.PENDING]
        )

        return results
    }

    /*
     * Get all friends of user ID.
     * @param {number} id - User ID
     * @returns {Promise<Array>} - Array of users
    */
    async getFriends(id) {
        const externalTable = 'users'

        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? AS u ' +
            'WHERE u.id = (SELECT user_id FROM ?? AS f WHERE f.user_id_friend = ? AND f.status = ?) ' +
            'OR u.id = (SELECT user_id_friend FROM ?? AS f2 WHERE f2.user_id = ? AND f2.status = ?)',
            [externalTable, this.#table, id, FriendRequestStatus.ACCEPTED, this.#table, id,
                FriendRequestStatus.ACCEPTED]
        )

        return results
    }

    /*
     * Checks if exists a mutual friend request between two users.
     * @param {number} userID - User ID
     * @param {number} externalUserID - External user ID
     * @returns {Promise} - Friend request between two users.
    */
    async #checkMutualFriendRequest(userID, externalUserID) {
        // Get friend request sent to user ID from external user ID
        const [results] = await global.connection.promise().query(
            'SELECT * FROM ?? WHERE (user_id = ? AND user_id_friend = ?) OR (user_id = ? AND user_id_friend = ?)',
            [this.#table, userID, externalUserID, externalUserID, userID]
        )

        return results
    }

    /*
     * Sets a friend request status to accepted.
     * @param {number} userID - User ID
     * @param {number} externalUserID - External user ID
    */
    async #updateFriendRequestStatus(userID, externalUserID) {
        // Update friend request to accepted
        await global.connection.promise().query(
            'UPDATE ?? SET status = ? WHERE user_id = ? AND user_id_friend = ?',
            [this.#table, FriendRequestStatus.ACCEPTED, externalUserID, userID]
        )
    }

    /*
     * Creates a friend request between two users if not exists, otherwise updates the status to accepted.
     * @param {number} userID - User ID
     * @param {number} externalUserID - External user ID
     * @returns {Promise} - Friend request message informing the user about the result of the operation
    */
    async createFriendRequest(userID, externalUserID) {
        // Check that user is not trying to send a friend request to himself/herself
        if (userID === externalUserID) { 
            return FriendRequestMessages.CANNOT_SELF_REQUEST
        }

        // Get mutual friend request
        let existsFriendRequest = await this.#checkMutualFriendRequest(userID, externalUserID)

        // Check if exists a mutual friend request
        if (existsFriendRequest) {
            // Check if friend request is pending
            if (existsFriendRequest.status === FriendRequestStatus.PENDING) {
                // Get who sent the friend request
                const friendRequestSender = existsFriendRequest.user_id

                // Check who sent the friend request
                if (friendRequestSender !== userID) {
                    // Friend request was sent by external user
                    // Update friend request to accepted
                    await this.#updateFriendRequestStatus(userID, externalUserID)

                    return FriendRequestMessages.ACCEPTED
                } else {
                    // Friend request was already sent by user
                    return FriendRequestMessages.ALREADY_SENT
                }
            } else {
                // Both users are already friends
                return FriendRequestMessages.ALREADY_FRIENDS
            }
        } else {
            // It does not exist a friend request between both users
            // Create friend request
            await global.connection.promise().query(
                'INSERT INTO ?? (user_id, user_id_friend, status) VALUES (?, ?, ?)' +
                ' ON DUPLICATE KEY UPDATE user_id = user_id;',
                [this.#table, userID, externalUserID, FriendRequestStatus.PENDING]
            )

            return FriendRequestMessages.SENT
        }
    }

    /*
     * Accepts a friend request between two users.
     * @param {number} userID - User ID
     * @param {number} externalUserID - External user ID
     * @returns {Promise} - Friend request message informing the user about the result of the operation
    */
    async acceptFriendRequest(userID, externalUserID) {
        // Get mutual friend request
        let existsFriendRequest = await this.#checkMutualFriendRequest(userID, externalUserID)

        // Check if exists a mutual friend request
        if (existsFriendRequest) {
            // Get who sent the friend request and its status
            const friendRequestStatus = existsFriendRequest.status
            const friendRequestSender = existsFriendRequest.user_id

            // Check if friend request is pending
            if (friendRequestStatus === FriendRequestStatus.PENDING) {
                // Check who sent the friend request
                if (friendRequestSender !== userID) {
                    // Friend request was sent by external user
                    // Update friend request to accepted
                    await this.#updateFriendRequestStatus(userID, externalUserID)

                    return FriendRequestMessages.ACCEPTED
                } else {
                    // Friend request was sent by user
                    return FriendRequestMessages.CANNOT_SELF_ACCEPT
                }
            } else {
                // Both users are already friends
                return FriendRequestMessages.ALREADY_FRIENDS
            }
        } else {
            // It does not exist a friend request between both users
            return FriendRequestMessages.NOT_FOUND
        }
    }

    /*
     * Rejects a friend request between two users if is pending or deletes the friendship if is accepted.
     * @param {number} userID - User ID
     * @param {number} externalUserID - External user ID
     * @returns {Promise} - Friend request message informing the user about the result of the operation
    */
    async deleteFriendRequestOrFriendship(userID, externalUserID) {
        // Get mutual friend request
        let existsFriendRequest = await this.#checkMutualFriendRequest(userID, externalUserID)

        // Check if exists a mutual friend request
        if (existsFriendRequest) {
            // Delete existing friend request or friendship between both users
            await global.connection.promise().query(
                'DELETE FROM ?? WHERE (user_id = ? AND user_id_friend = ?) OR (user_id = ? AND user_id_friend = ?)',
                [this.#table, userID, externalUserID, externalUserID, userID]
            )

            // TODO Delete messages between both users

            return FriendRequestMessages.DELETED

        } else {
            // It does not exist a friend request between both users
            return FriendRequestMessages.NOT_FOUND
        }
    }
}

module.exports = FriendDAO