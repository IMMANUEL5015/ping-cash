const router = require('express').Router();
const chargeRate = require('../controllers/chargeRate');

router.post('/',
    chargeRate.createChargeRate);

router.get('/',
    chargeRate.getChargeRates
);

router.get('/:id',
    chargeRate.findChargeRate,
    chargeRate.seeChargeRate
);

module.exports = router;