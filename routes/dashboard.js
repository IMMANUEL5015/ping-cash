const router = require('express').Router();
const dashboard = require('../controllers/dashboard');
const { protect } = require('../controllers/admin');

router.post('/get_auth_code', dashboard.getLoginCode);

router.get('/my_pinglinks', protect, dashboard.myPinglinks);

router.get('/my_pinglinks/:id', protect,
    dashboard.findPingLink,
    dashboard.myPingLinkTransactions);

router.patch('/set_bank_details', protect, dashboard.setBankDetails);

router.post('/withdrawal_request', protect,
    dashboard.validateWithdrawalRequest,
    dashboard.makeWithdrawalRequest);

router.get('/my_withdrawal_requests', protect,
    dashboard.myWithdrawalRequests);

module.exports = router;