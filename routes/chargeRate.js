const router = require('express').Router();
const chargeRate = require('../controllers/chargeRate');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.post('/',
    chargeRate.createChargeRate);

router.get('/',
    chargeRate.getChargeRates
);

router.get('/:id',
    chargeRate.findChargeRate,
    chargeRate.seeChargeRate
);

router.patch('/:id',
    chargeRate.findChargeRate,
    chargeRate.updateChargeRate
);

router.delete('/:id',
    chargeRate.findChargeRate,
    chargeRate.deleteChargeRate
);

module.exports = router;