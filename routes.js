const router = require('express').Router();
const transactionRouter = require('./routes/transaction');
const chargeRateRouter = require('./routes/chargeRate');
const currencyRouter = require('./routes/currency');
const globalErrorHandler = require('./utils/globalErrorHandler');
const currencyController = require('./controllers/currency');

router.use('/transactions', transactionRouter);
router.use('/charge-rates', chargeRateRouter);
router.use('/currencies', currencyRouter);

router.get('/countries', currencyController.getCountries);

router.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail', message: 'The resource you are looking for cannot be found.'
    });
});

router.use(globalErrorHandler);

module.exports = router;