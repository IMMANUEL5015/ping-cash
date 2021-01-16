const mongoose = require('mongoose');
const ChargeRate = require('../models/chargerate');

const transactionSchema = mongoose.Schema({
    transactionType: {
        type: String,
        required: [true, 'Please specify the transaction type.'],
        enum: ["send-to-nigeria", "send-within-nigeria"]
    },
    senderFullName: {
        type: String,
        required: [true, 'Please specify your fullname.'],
    },
    senderPhoneNumber: {
        type: String,
        required: [true, 'Please provide your phone number.']
    },
    accountNumberForRefund: String,
    bankForRefund: String,
    bankSortCode: String,
    receiverFullName: {
        type: String,
        required: [true, 'Please provide the full name of the receiver.']
    },
    receiverPhoneNumber: {
        type: String,
        required: [true, 'Please provide the phone number of the receiver.']
    },
    amount: {
        type: String,
        required: [true, 'Please specify an amount for this transaction.']
    },
    chargeReceiverTheCommission: Boolean,
    reference: {
        type: String,
        required: [true, 'Every transaction must have a unique reference.'],
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'refunded', 'received'],
        default: 'pending'
    },
    charges: {
        type: String
    },
    finalAmountPaid: {
        type: String
    },
    finalAmountReceived: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    country: {
        type: String,
        required: [true, 'Please specify the country you are sending money from.'],
        enum: [
            'Australia', 'Austria', 'Belgium', 'Bulgaria', 'Canada', 'Cyprus', 'Czech Republic',
            'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hong Kong',
            'Ireland', 'Italy', 'Japan', 'Latvia', 'Lithuania', 'Luxemborg', 'Malta',
            'Mexico', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Poland', 'Portugal',
            'Romania', 'Singapore', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
            'United Kingdom', 'United States'
        ]
    },
    currency: {
        type: String,
        required: [true, 'Please specify the currency you are using to make the payment.'],
        enum: [
            'aud', 'brl', 'gbp', 'n', 'bgn', 'cad', 'czk', 'dkk', 'eur', 'hkd', 'huf', 'ils',
            'jpy', 'myr', 'mxn', 'twd', 'nzd', 'nok', 'php', 'pln', 'ron', 'rub', 'sgd', 'sek',
            'chf', 'thb', 'usd'
        ]
    },
    chargeRate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChargeRate'
    }
});

transactionSchema.pre('save', async function (next) {
    //Determine the charges for a transaction
    if (this.transactionType === 'send-within-nigeria') {
        const chargeRate = await ChargeRate.findOne({
            name: 'within-nigeria'
        });

        this.chargeRate = chargeRate ? chargeRate : undefined;
        this.charges = chargeRate ? chargeRate.figure : '35';
    }

    if (this.transactionType === 'send-to-nigeria') {
        const chargeRate = await ChargeRate.findOne({
            name: 'to-nigeria'
        });

        if (chargeRate && chargeRate.flatOrPercentage === 'flat') {
            this.charges = chargeRate.figure;
        }

        if (chargeRate && chargeRate.flatOrPercentage === 'percent') {
            this.charges = (chargeRate.figure / 100) * this.amount;
        }

        this.chargeRate = chargeRate ? chargeRate : undefined;
    }

    //Calculate the finalAmountPaid
    if (!this.chargeReceiverTheCommission) {
        this.finalAmountPaid = Number(this.amount) + Number(this.charges);
    } else {
        this.finalAmountPaid = this.amount;
    }

    //Calculate the finalAmountReceived
    if (!this.chargeReceiverTheCommission) {
        this.finalAmountReceived = this.amount;
    } else {
        this.finalAmountReceived = this.amount - this.charges;
    }

    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);