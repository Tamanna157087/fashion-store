const Notification = require("../models/Notification");

const createNotification = async ({ type, title, message, link }) => {
  try {
    const notification = await Notification.create({
      type,
      title,
      message,
      link: link || "",
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error("Notification creation error:", error);
    return null;
  }
};

const getNotifications = async () => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
  const unreadCount = await Notification.countDocuments({ isRead: false });

  return {
    notifications,
    unreadCount,
  };
};

const markAllNotificationsRead = async () => {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  return await getNotifications();
};

const markNotificationRead = async (id) => {
  await Notification.findByIdAndUpdate(id, { isRead: true });
  return await getNotifications();
};

module.exports = {
  createNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
