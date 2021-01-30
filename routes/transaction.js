const router = require('express').Router();
const transaction = require('../controllers/transaction');
const { checkTransactionType, setForNigeria,
    setToNigeria, ensureReceiverIsNigerian } = require('../middlewares/transaction');

router.post('/',
    checkTransactionType,
    setForNigeria,
    setToNigeria,
    ensureReceiverIsNigerian,
    transaction.initializeTransaction
);

router.get('/:ref/payment-to-stripe',
    transaction.findTransaction,
    transaction.checkIfTransactionIsPending,
    transaction.ensureTransactionIsFromAbroad,
    transaction.makePayment
);

router.get(
    '/:ref/payment-to-fuspay',
    transaction.findTransaction,
    transaction.checkIfTransactionIsPending,
    transaction.ensureTransactionIsFromNigeria
);

router.post(
    '/fuspay/webhook_url',
    (req, res, next) => {
        console.log('POST, webhook', req.body);
    }
);

router.post(
    '/fuspay/callback_url',
    (req, res, next) => {
        console.log('POST, callback', req.body);
    }
);

module.exports = router;