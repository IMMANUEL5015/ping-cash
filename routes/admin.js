const router = require('express').Router();
const admin = require('../controllers/admin');

router.post('/register', admin.register)
router.post('/login', admin.login);
router.post('/logout', admin.protect, admin.logout);

router.use(admin.protect);

router.get(
    '/international_transactions',
    admin.viewInternationalTransactions
);
router.get(
    '/international_transactions/:id',
    admin.findInternationalTransaction,
    admin.viewInternationalTransaction
);

router.get(
    '/cancelled_international_transactions',
    admin.viewCancelledInternationalTransactions
);

router.get(
    '/refunded_international_transactions',
    admin.viewRefundedInternationalTransactions
);

router.get(
    '/pinglinks',
    admin.viewAllPinglinks
)

router.get(
    '/pinglinks/:id',
    admin.findPinglink,
    admin.viewPinglink
)

router.get(
    '/pinglinks/transactions/:id',
    admin.findPinglinkTransaction,
    admin.viewPinglinkTransaction
)

router.post(
    '/make_payout/:id',
    admin.makePayout
);

module.exports = router;