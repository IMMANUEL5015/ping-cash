const router = require('express').Router();
const admin = require('../controllers/admin');

router.post('/register', admin.register)
router.post('/login', admin.login);
router.post('/logout', admin.protect, admin.logout);
router.get(
    '/international_transactions',
    admin.protect,
    admin.viewInternationalTransactions
);
router.get(
    '/international_transactions/:id',
    admin.protect,
    admin.findInternationalTransaction,
    admin.viewInternationalTransaction
);

module.exports = router;