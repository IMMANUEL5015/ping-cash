const router = require('express').Router();
const transaction = require('../controllers/transaction');

router.post('/',
    transaction.initializeTransaction
);

module.exports = router;