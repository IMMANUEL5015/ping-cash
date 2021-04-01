const router = require('express').Router();
const accounting = require('../controllers/accounting');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.post('/',
    accounting.createAccountingItem);

router.get('/',
    accounting.getAccountingItems
);

router.get('/:id',
    accounting.findAccountingItem,
    accounting.seeAccountingItem
);

router.patch('/:id',
    accounting.findAccountingItem,
    accounting.updateAccountingItem
);

router.delete('/:id',
    accounting.findAccountingItem,
    accounting.deleteAccountingItem
);

module.exports = router;