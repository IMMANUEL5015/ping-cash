const Transaction = require('../models/transaction');
const randomString = require('random-string');

exports.initializeTransaction = async (req, res, next) => {
    try {
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
            receiverPhoneNumber: req.body.amount,
            chargeReceiverTheCommission: req.body.chargeReceiverTheCommission
        });

        return res.status(201).json({
            status: 'success', message: 'Transaction Initialized Successfully',
            transaction
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
}