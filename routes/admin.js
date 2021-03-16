const router = require('express').Router();
const admin = require('../controllers/admin');

router.post('/register', admin.register)
router.post('/login', admin.login);
router.post('/logout', admin.protect, admin.logout);

module.exports = router;