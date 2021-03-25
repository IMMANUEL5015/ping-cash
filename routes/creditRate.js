const router = require('express').Router();
const creditRate = require('../controllers/creditRate');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.post('/',
    creditRate.createCreditRate);

router.get('/',
    creditRate.getCreditRates
);

router.get('/:id',
    creditRate.findCreditRate,
    creditRate.seeCreditRate
);

router.patch('/:id',
    creditRate.findCreditRate,
    creditRate.updateCreditRate
);

router.delete('/:id',
    creditRate.findCreditRate,
    creditRate.deleteCreditRate
);

module.exports = router;