const Transaction = require('../models/transaction');

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
                await Transaction.findOneAndUpdate({ reference }, { status: 'cancelled' }, { new: true });
            }
        }
    }

    return res.status(error.statusCode || 500).json({
        status: error.status || 'error',
        message: error.message
    });
}