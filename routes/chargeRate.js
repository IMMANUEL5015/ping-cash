const router = require('express').Router();
const chargeRate = require('../controllers/chargeRate');
const admin = require('../controllers/admin');
const { checkIfLoggedInUserHasRequiredPrivilege } = require('../utils/otherUtils');

router.use(admin.protect);

router.post('/',
    checkIfLoggedInUserHasRequiredPrivilege('create-charge-rate'),
    chargeRate.createChargeRate);

router.get('/',
    checkIfLoggedInUserHasRequiredPrivilege('view-charge-rates'),
    chargeRate.getChargeRates
);

router.get('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('view-charge-rates'),
    chargeRate.findChargeRate,
    chargeRate.seeChargeRate
);

router.patch('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('update-charge-rate'),
    chargeRate.findChargeRate,
    chargeRate.updateChargeRate
);

router.delete('/:id',
    checkIfLoggedInUserHasRequiredPrivilege('delete-charge-rate'),
    chargeRate.findChargeRate,
    chargeRate.deleteChargeRate
);

module.exports = router;