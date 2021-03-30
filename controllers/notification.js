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
    const notifications = await Notification.find({
        user: req.user._id,
        status: 'unread'
    }).sort('-createdAt');

    return res.status(200).json({
        status: 'Success',
        notifications
    });
});

exports.markOneAsRead = catchAsync(async (req, res, next) => {
    await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, user: req.user._id },
        { status: 'read' },
        { new: true }
    );
    return res.status(200).json({
        status: 'Success'
    });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
    await Notification.updateMany(
        { user: req.user._id, status: 'unread' },
        { status: 'read' }
    );

    return res.status(200).json({
        status: 'Success'
    });
});