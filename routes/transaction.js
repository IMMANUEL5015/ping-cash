const router = require('express').Router();
const transaction = require('../controllers/transaction');

router.post('/transactions',
    transaction.initializeTransaction
);

module.exports = router;