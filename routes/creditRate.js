const router = require('express').Router();
const creditRate = require('../controllers/creditRate');
const admin = require('../controllers/admin');
const { checkIfLoggedInUserHasRequiredPrivilege } = require('../utils/otherUtils');

router.use(admin.protect);

router.post('/',
    checkIfLoggedInUserHasRequiredPrivilege('create-credit-rate'),
    creditRate.createCreditRate);

router.get('/',
    checkIfLoggedInUserHasRequiredPrivilege('view-credit-rates'),
    creditRate.getCreditRates
);

router.get('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-credit-rates'),
    creditRate.findCreditRate,
    creditRate.seeCreditRate
);

router.patch('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('update-credit-rate'),
    creditRate.findCreditRate,
    creditRate.updateCreditRate
);

router.delete('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('delete-credit-rate'),
    creditRate.findCreditRate,
    creditRate.deleteCreditRate
);

module.exports = router;