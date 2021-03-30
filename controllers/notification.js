const Notification = require('../models/notification');

exports.createNotification = async (obj) => {
    try {
        const notification = await Notification.create(obj);
        return notification;
    } catch (error) {
        console.error(error);
    }
}

exports.unreadNotifications = async (userId) => {
    try {
        const notifications = await Notification.find({
            user: userId,
            status: 'unread'
        }).sort('-createdAt');

        return notifications;
    } catch (error) {
        console.error(error);
    }
}

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