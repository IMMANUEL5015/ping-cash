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
    const { transactionType, country, currency } = req.body;
    if (transactionType === "send-to-nigeria") {
        if (!country) return next(new AppError('Please specify the country you are sending money from.', 400));
        if (!currency) return next(new AppError("Please specify the currency you want to use to send money.", 400));

        const foundCountry = await Country.findOne({ name: country });
        if (!foundCountry) return next(new AppError('We cannot accept payments from the country you specified!', 404));

        const foundCurrency = await Currency.findOne({ name: currency });
        if (!foundCurrency) return next(new AppError('Currency not supported currently!', 404));

        req.body.currencyId = foundCurrency;
    }

    return next();
});

