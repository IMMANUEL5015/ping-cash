const mongoose = require('mongoose');

const pinglinkSchema = mongoose.Schema({
    linkName: {
        type: String,
        required: [true, 'Please provide a name for your ping link.']
    },
    urlName: {
        type: String,
        required: [true, 'Please provide a url name for your ping link.'],
        unique: true
    },
    paymentId: {
        type: String,
        required: [true, 'Please provide a payment id.']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address.']
    },
    description: {
        type: String,
        required: [true, "Please provide a description for this ping link."]
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please tell us your phone number.']
    },
    pin: {
        type: String,
        required: [true, 'Please provide a pin for tracking this pinglink.'],
        unique: true,
        minlength: [4, 'Your pin must consist of four characters.'],
        maxlength: [4, 'Your pin must consist of four characters.'],
    },
    amount: {
        type: String,
        required: [true, 'Please specify an amount.']
    },
    accountNumber: {
        type: String,
        required: [true, 'Please specify your account number.']
    },
    bankName: {
        type: String,
        required: [true, 'Please specify your bank name.']
    },
    bankSortCode: {
        type: String,
        required: [true, 'Please provide your bank sort code.']
    },
    thankYouMessage: {
        type: String,
        required: [true, 'Please specify a thank you message.']
    },
    url: {
        type: String,
        required: [true, 'Every pinglink must have a url.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = PingLink = mongoose.model('PingLink', pinglinkSchema);