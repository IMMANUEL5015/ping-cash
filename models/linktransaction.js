const mongoose = require('mongoose');
const ChargeRate = require('../models/chargerate');
const CreditRate = require('../models/creditrate');
const axios = require('axios');
const { calcAdministrativeExpenses } = require('../utils/otherUtils');

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
    payment_intent: String,
    exchangeRate: String,
    initialExchangeRate: String,
    adminExchangeRate: String,
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
        enum: ['pending', 'paid', 'received', 'failed'],
        default: 'failed'
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
    reference: {
        type: String,
        required: [true, 'Every transaction must have a unique reference.'],
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    administrativeExpensesInNaira: Number,//Based on the percentage set for admin expenses
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

    const result = await calcAdministrativeExpenses(dollarInNaira, this.finalAmountReceived, 'pinglink');
    this.administrativeExpenses = result[0];
    this.actualAdministrativeExpensesInNaira = result[1];
    this.administrativeExpensesOverflow = this.administrativeExpensesInNaira - this.actualAdministrativeExpensesInNaira;

    next();
});

module.exports = LinkTransaction = mongoose.model('LinkTransaction', linkTransactionSchema);