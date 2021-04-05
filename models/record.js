const mongoose = require('mongoose');

const recordSchema = mongoose.Schema({
    recordType: {
        type: String,
        required: true,
        enum: ['pinglinks', 'international-transactions', 'local-transactions']
    },
    totalAmount: Number,
    totalFinalAmountPaid: Number,
    totalFinalAmountReceived: Number,
    totalFinalAmountReceivedInNaira: Number,
    totalAdministrativeExpensesInNaira: Number,
    totalActualAdministrativeExpensesInNaira: Number,
    totalAdministrativeExpensesOverflow: Number
});

module.exports = Record = mongoose.model('Record', recordSchema);