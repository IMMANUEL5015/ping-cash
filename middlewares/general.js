const axios = require('axios');
const catchAsync = require('../utils/catchAsync');
const responses = require('../utils/responses');
const ChargeRate = require('../models/chargerate');
const { getBankSortCode, getBankName } = require('../utils/getBankDetails');
const CreditRate = require('../models/creditrate');

exports.seeNigerianBanks = catchAsync(async (req, res, next) => {
    const url = 'https://api.paystack.co/bank';
    let banks = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_API_KEY}`
        }
    });
    banks = banks.data.data;

    return responses.success(res, 200, 'Success', 'All banks and their bank code.', banks);
});

exports.setBankAndBankCode = catchAsync(async (req, res, next) => {
    if (req.body.bankForRefund) {
        req.body.bankSortCode = await getBankSortCode(req.body.bankForRefund);
    }

    if (req.body.bankName) {
        req.body.bankSortCode = await getBankSortCode(req.body.bankName);
    }

    return next();
});

exports.calculator = catchAsync(async (req, res, next) => {
    const { type, amountToSend } = req.body;
    let theChargeRate;
    let charges;
    let amountToBeReceivedIfSenderPaysForCharges;
    let amountToBeReceivedIfReceiverPaysForCharges;
    let currency;
    let exchangeRate;

    //Determine the charges for a transaction
    if (type === 'local') {
        let chargeRate = await ChargeRate.findOne({
            name: 'within-nigeria'
        });

        theChargeRate = chargeRate ? chargeRate : undefined;
        charges = chargeRate ? chargeRate.figure : '35';

        currency = 'Naira';
    }

    if (type === 'international') {
        currency = 'Dollars';

        let chargeRate = await ChargeRate.findOne({
            name: 'to-nigeria'
        });

        charges = (chargeRate.figure / 100) * amountToSend;

        theChargeRate = chargeRate ? chargeRate : undefined;
    }

    amountToBeReceivedIfSenderPaysForCharges = Number(amountToSend) + Number(charges);
    amountToBeReceivedIfReceiverPaysForCharges = Number(amountToSend) - Number(charges);

    if (type === 'local') {
        exchangeRate = 1;
    }

    if (type === 'international') {
        let currentCreditRate = await CreditRate.findOne({ name: 'credit-rate' });
        currentCreditRate = Number(currentCreditRate.figure);

        const url = `http://api.currencylayer.com/live?access_key=${process.env.CURRENCY_CONVERTER_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;
        const quotes = data.quotes;
        let dollarInNaira = quotes.USDNGN;

        exchangeRate = (currentCreditRate / 100) * dollarInNaira;
        exchangeRate = exchangeRate + dollarInNaira;
    }

    const data = {
        amountToSend, type, charges, theChargeRate,
        amountToBeReceivedIfSenderPaysForCharges,
        amountToBeReceivedIfReceiverPaysForCharges,
        currency, exchangeRate
    };
    return responses.success(res, 200, 'Success', 'Calculation Completed!', data);
});

exports.verifyBankAcct = catchAsync(async (req, res, next) => {
    const {
        accountNumber, accountNumberForRefund,
        bankName, bankForRefund
    } = req.body;

    let accountName;
    let bankSortCode;

    if (accountNumber && bankName) {
        bankSortCode = await getBankSortCode(bankName);
    }

    if (accountNumberForRefund && bankForRefund) {
        bankSortCode = await getBankSortCode(bankForRefund);

    }
    if (accountNumber && bankSortCode) {
        accountName = await getBankName(accountNumber, bankSortCode);
    }

    if (accountNumberForRefund && bankSortCode) {
        accountName = await getBankName(accountNumberForRefund, bankSortCode);
    }

    return responses.success(res, 200, "Success", "Account Details Resolved Successfully!", { accountName });
});