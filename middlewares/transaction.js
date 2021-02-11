const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Currency = require('../models/currency');
const Country = require('../models/country');

exports.checkTransactionType = (req, res, next) => {
    const { transactionType } = req.body;
    if (!transactionType) return next(new AppError('Transaction type is required!', 400));
    return next();
}

exports.setForNigeria = catchAsync(async (req, res, next) => {
    const { transactionType } = req.body;
    if (transactionType === "send-within-nigeria") {
        req.body.country = 'Nigeria';
        req.body.currency = 'Naira';

        const currency = await Currency.findOne({ name: 'Naira' });
        if (currency) req.body.currencyId = currency;
    }

    return next();
});

exports.setToNigeria = catchAsync(async (req, res, next) => {
    const { transactionType, country, currency, senderEmailAddress, amount } = req.body;
    if (transactionType === "send-to-nigeria") {
        if (!country) return next(new AppError('Please specify the country you are sending money from.', 400));
        if (!currency) return next(new AppError("Please specify the currency you want to use to send money.", 400));

        const foundCountry = await Country.findOne({ name: country });
        if (!foundCountry) return next(new AppError('We cannot accept payments from the country you specified!', 404));

        const foundCurrency = await Currency.findOne({ name: currency });
        if (!foundCurrency) return next(new AppError('Only US dollars currency is currently supported.', 400));

        req.body.currencyId = foundCurrency;

        if (amount && String(amount.includes('.'))) return next(new AppError('Currently, we only accept money in whole number values, not decimals.', 400));
    }

    return next();
});

exports.ensureReceiverIsNigerian = (req, res, next) => {
    if (!req.body.receiverPhoneNumber) return next(new AppError('Receiver phone number is required!', 400));
    if (req.body.receiverPhoneNumber.length === 11) return next();
    return next(new AppError('Receiver phone number should be 11 digits. Eg: 09064058820', 400));
}