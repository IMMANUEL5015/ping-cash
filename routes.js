const router = require('express').Router();
const transactionRouter = require('./routes/transaction');
const pinglinkRouter = require('./routes/pinglink');
const chargeRateRouter = require('./routes/chargeRate');
const creditRateRouter = require('./routes/creditRate');
const currencyRouter = require('./routes/currency');
const generalRouter = require('./routes/general');
const smsRouter = require('./routes/sms');
const globalErrorHandler = require('./utils/globalErrorHandler');
const currencyController = require('./controllers/currency');
const adminRouter = require('./routes/admin');
const pcategoryRouter = require('./routes/pcategory');
const privilegeRouter = require('./routes/privilege');
const notificationRouter = require('./routes/notification');
const expenseRouter = require('./routes/expense');
const roleRouter = require('./routes/role');
const auth = require('./routes/auth');

router.use('/admin', adminRouter);
router.use('/auth', auth);
router.use('/notifications', notificationRouter);
router.use('/expenses', expenseRouter);
router.use('/pcategories', pcategoryRouter);
router.use('/privileges', privilegeRouter);
router.use('/roles', roleRouter);
router.use('/transactions', transactionRouter);
router.use('/pinglinks', pinglinkRouter);
router.use('/charge-rates', chargeRateRouter);
router.use('/credit-rates', creditRateRouter);
router.use('/currencies', currencyRouter);
router.use('/sms-services', smsRouter);
router.use('/general', generalRouter);

router.get('/countries', currencyController.getCountries);

router.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail', message: 'The resource you are looking for cannot be found.'
    });
});

router.use(globalErrorHandler);

module.exports = router;