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

router.get(
    '/pinglinks',
    admin.protect,
    admin.viewAllPinglinks
)

router.get(
    '/pinglinks/:id',
    admin.protect,
    admin.findPinglink,
    admin.viewPinglink
)

router.get(
    '/pinglinks/transactions/:id',
    admin.protect,
    admin.findPinglinkTransaction,
    admin.viewPinglinkTransaction
)

module.exports = router;