const router = require('express').Router();
const auth = require('../controllers/auth');

router.post('/get_auth_code', auth.getLoginCode);

module.exports = router;