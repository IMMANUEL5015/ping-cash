const router = require('express').Router();
const currency = require('../controllers/currency');

router.post('/',
    currency.createCurrency);

router.get('/',
    currency.getCurrencies
);

router.get('/:id',
    currency.findCurrency,
    currency.seeCurrency
);

router.patch('/:id',
    currency.findCurrency,
    currency.updateCurrency
);

router.delete('/:id',
    currency.findCurrency,
    currency.deleteCurrency
);

module.exports = router;