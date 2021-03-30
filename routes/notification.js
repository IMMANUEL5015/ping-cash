const router = require('express').Router();
const notification = require('../controllers/notification');
const admin = require('../controllers/admin');

router.use(admin.protect);

router.get('/unread', notification.unreadNotifications);
router.patch('/mark_as_read/:notificationId', notification.markOneAsRead);

module.exports = router;