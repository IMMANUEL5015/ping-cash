const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    transactionType: String,
    senderFullName: String,
    senderPhoneNumber: String,
    accountNumberForRefund: String,
    bankForRefund: String,
    receiverFullName: String,
    receiverPhoneNumber: String,
    amount: String,
    chargeReceiverTheCommission: Boolean
});

module.exports = mongoose.model('Transaction', transactionSchema);