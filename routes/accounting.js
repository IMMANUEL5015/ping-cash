const router = require('express').Router();
const accounting = require('../controllers/accounting');
const admin = require('../controllers/admin');
const { checkIfLoggedInUserHasRequiredPrivilege } = require('../utils/otherUtils');

router.use(admin.protect);

router.post('/',
    checkIfLoggedInUserHasRequiredPrivilege('create-accounting-item'),
    accounting.createAccountingItem);

router.get('/',
    checkIfLoggedInUserHasRequiredPrivilege('view-accounting-items'),
    accounting.getAccountingItems
);

router.get('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-accounting-items'),
    accounting.findAccountingItem,
    accounting.seeAccountingItem
);

router.patch('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('update-accounting-item'),
    accounting.findAccountingItem,
    accounting.updateAccountingItem
);

router.delete('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('delete-accounting-item'),
    accounting.findAccountingItem,
    accounting.deleteAccountingItem
);

module.exports = router;