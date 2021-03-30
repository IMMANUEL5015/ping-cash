const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    message: {
        type: String,
        required: [true, 'Message is required.']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Notification = mongoose.model('Notification', notificationSchema);