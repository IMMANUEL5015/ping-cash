const router = require('express').Router();
const creditRate = require('../controllers/creditRate');

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