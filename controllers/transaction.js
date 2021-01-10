const Transaction = require('../models/transaction');
const randomString = require('random-string');

exports.initializeTransaction = async (req, res, next) => {
    try {
        const uniqueString = randomString({ length: 6, numeric: true });
        const transaction = await Transaction.create({
            ...req.body,
            status: 'pending',
            reference: `PNG-${uniqueString}eq`
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