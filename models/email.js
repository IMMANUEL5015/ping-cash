const mongoose = require('mongoose');

const emailSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'sent'],
        default: 'pending'
    }
});

module.exports = mongoose.model('Email', emailSchema);