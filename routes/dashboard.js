const router = require('express').Router();
const dashboard = require('../controllers/dashboard');
const { protect } = require('../controllers/admin');

router.post('/get_auth_code', dashboard.getLoginCode);

router.get('/my_pinglinks', protect, dashboard.myPinglinks);

router.get('/my_pinglinks/:id', protect,
    dashboard.findPingLink,
    dashboard.myPingLinkTransactions);

router.post('/set_bank_details', protect, dashboard.setBankDetails);

module.exports = router;