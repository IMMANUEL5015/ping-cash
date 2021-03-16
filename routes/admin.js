const router = require('express').Router();
const admin = require('../controllers/admin');

router.post('/register', admin.register)

module.exports = router;