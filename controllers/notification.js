const Notification = require('../models/notification');
const catchAsync = require('../utils/catchAsync');

exports.createNotification = async (obj) => {
    try {
        const notification = await Notification.create(obj);
        return notification;
    } catch (error) {
        console.error(error);
    }
}

exports.unreadNotifications = catchAsync(async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            user: req.user._id,
            status: 'unread'
        }).sort('-createdAt');

        return res.status(200).json({
            status: 'Success',
            notifications
        });
    } catch (error) {
        console.error(error);
    }
});

exports.markOneAsRead = async (notificationId) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { status: 'read' },
            { new: true }
        );

        return notification;
    } catch (error) {
        console.error(error);
    }
}

exports.markAllAsRead = async (userId) => {
    try {
        await Notification.updateMany(
            { user: userId, status: 'unread' },
            { status: 'read' }
        );

        return 'Updated Succesfully.';
    } catch (error) {
        console.error(error);
    }
}