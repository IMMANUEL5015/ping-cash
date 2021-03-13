const mongoose = require('mongoose');
const ChargeRate = require('../models/chargerate');
const CreditRate = require('../models/creditrate');
const axios = require('axios');

const linkTransactionSchema = mongoose.Schema({
    pingLink: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PingLink'
    },
    amount: String,
    chargeRate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChargeRate'
    },
    session_id: String,
    exchangeRate: String,
    finalAmountReceived: {
        type: String
    },
    finalAmountReceivedInNaira: {
        type: String
    },
    charges: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'received', 'failed']
    },
    fullName: {
        type: String,
        required: ['true', 'What is your full name?']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address.']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please provide your phone number.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

linkTransactionSchema.pre('save', async function (next) {
    //Determine the charges for a transaction

    const chargeRate = await ChargeRate.findOne({
        name: 'to-nigeria'
    });

    if (chargeRate && chargeRate.flatOrPercentage === 'percent') {
        this.charges = (Number(chargeRate.figure) / 100) * Number(this.amount);
    }

    this.chargeRate = chargeRate ? chargeRate : undefined;

    //Calculate the finalAmountReceived
    this.finalAmountReceived = Number(this.amount) - Number(this.charges);

    let currentCreditRate = await CreditRate.findOne({ name: 'credit-rate' });
    currentCreditRate = Number(currentCreditRate.figure);

    const url = `http://api.currencylayer.com/live?access_key=${process.env.CURRENCY_CONVERTER_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;
    const quotes = data.quotes;
    let dollarInNaira = quotes.USDNGN;

    let exchangeRate
    //Convert it to Naira based on the credit rate
    exchangeRate = (currentCreditRate / 100) * dollarInNaira;
    exchangeRate = exchangeRate + dollarInNaira;

    //Set the exchange rate that was used for the transaction
    this.exchangeRate = exchangeRate;

    //Set the finalAmountReceivedInNaira
    this.finalAmountReceivedInNaira = (Number(this.exchangeRate) * Number(this.finalAmountReceived));

    next();
});

module.exports = LinkTransaction = mongoose.model('LinkTransaction', linkTransactionSchema);