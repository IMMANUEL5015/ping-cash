const router = require('express').Router();
const transaction = require('../controllers/transaction');
const { checkTransactionType, setForNigeria, setToNigeria } = require('../middlewares/transaction');

router.post('/',
    checkTransactionType,
    setForNigeria,
    setToNigeria,
    transaction.initializeTransaction
);

module.exports = router;