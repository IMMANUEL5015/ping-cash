const router = require('express').Router();
const transaction = require('../controllers/transaction');
const { checkTransactionType, setForNigeria, setToNigeria } = require('../middlewares/transaction');

router.post('/',
    checkTransactionType,
    setForNigeria,
    setToNigeria,
    transaction.initializeTransaction
);

router.get('/:ref/payment-to-stripe',
    transaction.findTransaction,
    transaction.checkIfTransactionIsPending,
    transaction.makePayment
);

module.exports = router;