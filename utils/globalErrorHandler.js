const Transaction = require('../models/transaction');
const {
    refundMoneyToNigerian,
    refundMoneyToForeigner
} = require('../controllers/transaction');
const AppError = require('./appError');
const { generateRef } = require('./otherUtils');

const handleJwtError = () => new AppError('An error occured. Please login again.', 401);
const handleTokenExpiredError = () => new AppError('You have been logged out of the application. Please login again.', 401)

module.exports = async (error, req, res, next) => {
    if (error.isAxiosError) {
        const { config } = error;
        const data = JSON.parse(config.data);
        if (
            config.url === 'https://api.fusbeast.com/v1/Transfer/Verify' &&
            config.method === 'post' &&
            data.merchant_id === process.env.MERCHANT_ID
        ) {
            const reference = data.reference;
            if (reference) {
                const transaction = await Transaction.findOneAndUpdate(
                    { dynamicReference: reference },
                    { status: 'cancelled', dynamicReference: generateRef() },
                    { new: true }
                );
                //Refund money to the Nigerian Sender
                if (transaction.transactionType === 'send-within-nigeria') {
                    await refundMoneyToNigerian(transaction);
                }

                //Refund money to the Foreign Sender
                if (transaction.transactionType === 'send-to-nigeria') {
                    await refundMoneyToForeigner(transaction);
                }
            }
        }
    }

    if (error.name === 'CastError') {
        const message = `Invalid ${error.path}: ${error.value}`;
        error.message = message;
    }

    if (error.code === 11000) {
        const value = error.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
        const message = `(${value}) is already in use. Please use something else.`;
        error.message = message;
    }

    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(el => el.message);
        const message = `Invalid Input Data. ${errors.join('. ')}`;
        error.message = message;
    }
    console.error(error);

    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    return res.status(error.statusCode || 500).json({
        status: error.status || 'error',
        message: error.message,
        msg: error.message
    });
}