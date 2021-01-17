const mongoose = require('mongoose');

const smsSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please specify the name of the sms service you want to use.'],
        unique: true,
        enum: ['Twilio', 'Telesign', 'Termii']
    },
    active: {
        type: Boolean,
        default: false
    }
});

module.exports = Sms = mongoose.model('Sms', smsSchema);