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

module.exports = router;