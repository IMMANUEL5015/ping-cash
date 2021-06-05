const router = require('express').Router();
const admin = require('../controllers/admin');
const { checkIfLoggedInUserHasRequiredPrivilege } = require('../utils/otherUtils');

router.post('/register', admin.checkAdminCode, admin.register)
router.post('/login', admin.login);
router.post('/logout', admin.protect, admin.logout);
router.post('/forgotPassword', admin.forgotPassword);
router.patch('/resetPassword/:token', admin.resetPassword);

router.use(admin.protect);

router.post(
    '/create_user',
    checkIfLoggedInUserHasRequiredPrivilege('create-user'),
    admin.checkForRoles,
    admin.createUser
);

router.get(
    '/users',
    checkIfLoggedInUserHasRequiredPrivilege('view-administrators'),
    admin.getUsers
);

router.get(
    '/me',
    admin.getUser
);

router.get(
    '/users/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-administrators'),
    admin.getUser
);

router.patch(
    '/users/:id',
    checkIfLoggedInUserHasRequiredPrivilege('update-administrator'),
    admin.findUser,
    admin.removeFields,
    admin.editUser
);

router.delete(
    '/users/:id',
    checkIfLoggedInUserHasRequiredPrivilege('delete-administrator'),
    admin.findUser,
    admin.deleteUser
);

router.get(
    '/international_transactions',
    checkIfLoggedInUserHasRequiredPrivilege('view-international-transactions'),
    admin.viewInternationalTransactions
);
router.get(
    '/international_transactions/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-international-transactions'),
    admin.findInternationalTransaction,
    admin.viewInternationalTransaction
);

router.get(
    '/cancelled_international_transactions',
    checkIfLoggedInUserHasRequiredPrivilege('view-cancelled-international-transactions'),
    admin.viewCancelledInternationalTransactions
);

router.get(
    '/refunded_international_transactions',
    checkIfLoggedInUserHasRequiredPrivilege('view-refunded-international-transactions'),
    admin.viewRefundedInternationalTransactions
);

router.get(
    '/pinglinks',
    checkIfLoggedInUserHasRequiredPrivilege('view-all-pinglink-transactions'),
    admin.viewAllPinglinks
)

router.get(
    '/pinglinks/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-all-pinglink-transactions'),
    admin.findPinglink,
    admin.viewPinglink
)

router.get(
    '/pinglinks/transactions/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-all-pinglink-transactions'),
    admin.findPinglinkTransaction,
    admin.viewPinglinkTransaction
)

router.get(
    '/failed_transactions',
    checkIfLoggedInUserHasRequiredPrivilege('view-failed-transactions'),
    admin.viewFailedTransactions
);

router.get(
    '/failed_pinglink_transactions',
    checkIfLoggedInUserHasRequiredPrivilege('view-failed-transactions'),
    admin.viewFailedPinglinkTransactions
);

router.post(
    '/view_withdrawal_requests/',
    checkIfLoggedInUserHasRequiredPrivilege('make-payout'),
    admin.viewWithdrawalRequests
);


module.exports = router;