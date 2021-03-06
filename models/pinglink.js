const mongoose = require('mongoose');

const pinglinkSchema = mongoose.Schema({
    linkName: {
        type: String,
        required: [true, 'Please tell us your name.']
    },
    urlName: {
        type: String,
        required: [true, 'This field is required.'],
        unique: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please provide your phone number.'],
        minlength: [11, 'Your phone number should consist of 11 characters.'],
        maxlength: [11, 'Your phone number should consist of 11 characters.']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address.']
    },
    paymentType: {
        required: [true, 'Please specify the payment type for this pinglink.'],
        type: String,
        enum: ["fixed", "flexible"],
        default: "fixed"
    },
    minimumAmount: String,
    pin: {
        type: String,
        required: [true, 'Please provide a unique tracking pin for this ping link.'],
        minlength: [4, 'Please your pin should consist of 4 characters.'],
        maxlength: [4, 'Please your pin should consist of 4 characters.'],
        select: false
    },
    linkAmount: {
        type: String,
        required: [true, 'Please specify an amount in dollars for this ping link.']
    },
    accountNumber: {
        type: String,
        required: [true, 'Please tell us your account number.']
    },
    bankName: {
        type: String,
        required: [true, 'Please tell us your bank name.']
    },
    bankSortCode: {
        type: String,
        required: [true, 'Please tell us your bank sort code.']
    },
    redirectUrl: String,
    thankYouMessage: String,
    linkUrl: { type: String, unique: true },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

module.exports = PingLink = mongoose.model('PingLink', pinglinkSchema);