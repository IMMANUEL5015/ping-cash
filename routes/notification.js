const router = require('express').Router();
const notification = require('../controllers/notification');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.get('/unread', notification.unreadNotifications);

module.exports = router;