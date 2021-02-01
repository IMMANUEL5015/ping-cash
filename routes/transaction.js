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

router.get('/:ref',
    transaction.findTransaction,
    transaction.viewSpecificTransaction
)

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
    transaction.ensureTransactionIsFromNigeria,
    transaction.getCheckoutUrl
);

router.get('/fuspay/callback_url',
    transaction.verifyFuspayPayment
);

router.patch(
    '/:ref',
    transaction.findTransaction,
    transaction.checkIfTransactionIsPending,
    checkTransactionType,
    setForNigeria,
    setToNigeria,
    ensureReceiverIsNigerian,
    transaction.updateTransaction
);

router.patch(
    '/:ref/cancel',
    transaction.findTransaction,
    transaction.cancelTransaction
);

module.exports = router;