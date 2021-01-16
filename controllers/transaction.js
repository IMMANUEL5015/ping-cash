const Transaction = require('../models/transaction');
const randomString = require('random-string');
const catchAsync = require('../utils/catchAsync');

exports.initializeTransaction = catchAsync(async (req, res, next) => {
    const uniqueString = randomString({ length: 6, numeric: true });
    const transaction = await Transaction.create({
        reference: `PNG-${uniqueString}eq`,
        transactionType: req.body.transactionType,
        senderFullName: req.body.senderFullName,
        senderPhoneNumber: req.body.senderPhoneNumber,
        accountNumberForRefund: req.body.accountNumberForRefund,
        bankForRefund: req.body.bankForRefund,
        bankSortCode: req.body.bankSortCode,
        receiverFullName: req.body.receiverFullName,
        receiverPhoneNumber: req.body.receiverPhoneNumber,
        amount: req.body.amount,
        chargeReceiverTheCommission: req.body.chargeReceiverTheCommission,
        country: req.body.country,
        currency: req.body.currency
    });

    return res.status(201).json({
        status: 'success', message: 'Transaction Initialized Successfully',
        transaction
    });
});

