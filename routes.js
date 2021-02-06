const router = require('express').Router();
const transactionRouter = require('./routes/transaction');
const pinglinkRouter = require('./routes/pinglink');
const chargeRateRouter = require('./routes/chargeRate');
const creditRateRouter = require('./routes/creditRate');
const currencyRouter = require('./routes/currency');
const smsRouter = require('./routes/sms');
const globalErrorHandler = require('./utils/globalErrorHandler');
const currencyController = require('./controllers/currency');

router.use('/transactions', transactionRouter);
router.use('/pinglinks', pinglinkRouter);
router.use('/charge-rates', chargeRateRouter);
router.use('/credit-rates', creditRateRouter);
router.use('/currencies', currencyRouter);
router.use('/sms-services', smsRouter);

router.get('/countries', currencyController.getCountries);

router.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail', message: 'The resource you are looking for cannot be found.'
    });
});

router.use(globalErrorHandler);

module.exports = router;