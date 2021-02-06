const Transaction = require('../models/transaction');
const {
    refundMoneyToNigerian,
    refundMoneyToForeigner
} = require('../controllers/transaction');

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
                const transaction = await Transaction.findOneAndUpdate({ reference }, { status: 'cancelled' }, { new: true });
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

    return res.status(error.statusCode || 500).json({
        status: error.status || 'error',
        message: error.message
    });
}