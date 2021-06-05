const router = require('express').Router();
const auth = require('../controllers/auth');
const { protect } = require('../controllers/admin');

router.post('/get_auth_code', auth.getLoginCode);

router.get('/my_pinglinks', protect, auth.myPinglinks);

module.exports = router;