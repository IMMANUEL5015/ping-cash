const mongoose = require('mongoose');
const ChargeRate = require('../models/chargerate');
const CreditRate = require('../models/creditrate');
const axios = require('axios');
const { calcAdministrativeExpenses } = require('../utils/otherUtils');

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
    senderEmailAddress: {
        type: String,
        required: [true, 'Please provide your email address.']
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
    dynamicReference: {
        type: String,
        required: [true, 'Every transaction must have a unique dynamic reference.'],
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'received', 'failed', 'refunded', 'refund-failed'],
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
    finalAmountReceivedInNaira: {
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
        required: [true, 'Please specify the country you are sending money from.']
    },
    currency: {
        type: String,
        required: [true, 'Please specify the currency you are using to make the payment.']
    },
    chargeRate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChargeRate'
    },
    currencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency'
    },
    session_id: String,
    exchangeRate: String,
    initialExchangeRate: String,
    adminExchangeRate: String,
    paymentIntent: String,
    authorization_code: String,
    administrativeExpensesInNaira: Number, //Based on the percentage set for admin expenses
    administrativeExpenses: [
        {
            expense: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Expense'
            },
            amountInNaira: Number
        }
    ],
    actualAdministrativeExpensesInNaira: Number, //The reality
    administrativeExpensesOverflow: String, //The difference between the ideal and the real
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

    //Calculate finalAmountReceivedInNaira
    if (this.transactionType === 'send-within-nigeria') {
        this.finalAmountReceivedInNaira = this.finalAmountReceived;
        this.exchangeRate = 1;
    }

    if (this.transactionType === 'send-to-nigeria') {
        //Know the currency in use
        let currencyInUse = this.currencyId.abbreviation;

        currencyInUse = currencyInUse.toUpperCase();

        let currentCreditRate = await CreditRate.findOne({ name: 'credit-rate' });
        currentCreditRate = Number(currentCreditRate.figure);

        const url = `http://api.currencylayer.com/live?access_key=${process.env.CURRENCY_CONVERTER_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;
        const quotes = data.quotes;
        let dollarInNaira = quotes.USDNGN;

        let adminCut;
        //Convert it to Naira based on the credit rate
        adminCut = (currentCreditRate / 100) * dollarInNaira;
        const exchangeRate = dollarInNaira - adminCut;

        //Set the exchange rate that was used for the transaction
        this.exchangeRate = exchangeRate;
        this.initialExchangeRate = dollarInNaira;
        this.adminExchangeRate = adminCut;

        //Set the finalAmountReceivedInNaira
        this.finalAmountReceivedInNaira = (Number(this.exchangeRate) * Number(this.finalAmountReceived));
        this.administrativeExpensesInNaira = (adminCut * Number(this.finalAmountReceived));

        const result = await calcAdministrativeExpenses(dollarInNaira, this.finalAmountReceived, 'send-money-to-nigeria');
        this.administrativeExpenses = result[0];
        this.actualAdministrativeExpensesInNaira = result[1];
        this.administrativeExpensesOverflow = this.administrativeExpensesInNaira - this.actualAdministrativeExpensesInNaira;
    }

    next();
});

transactionSchema.pre(/^findOne/, function (next) {
    this.populate('currencyId');
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);