const friendRequestStatus = {
    PENDING: 0,
    ACCEPTED: 1
}

const friendRequestMessages = {
    NOT_FOUND: {
        message: 'Friend request or friendship not found',
        status: 'not_found'
    },
    CANNOT_SELF_ACCEPT: {
        message: 'You cannot accept your own friend request',
        status: 'cannot_self_accept'
    },
    CANNOT_SELF_REQUEST:{
        message: 'You cannot request to be your own friend',
        status: 'cannot_self_request'
    },
    SENT: {
        message: 'Friend request sent successfully to external user',
        status: 'pending'
    },
    ALREADY_SENT: {
        message: 'Friend request was already sent to external user',
        status: 'pending'
    },
    ACCEPTED: {
        message: 'Friend request received from external user has been accepted',
        status: 'accepted'
    },
    ALREADY_FRIENDS: {
        message: 'External user is already your friend',
        status: 'accepted'
    },
    DELETED: {
        message: 'Friend request received from external user has been rejected or mutual friendship has been deleted',
        status: 'deleted'
    }
}

module.exports = [friendRequestStatus, friendRequestMessages]