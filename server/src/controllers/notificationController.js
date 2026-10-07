const {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../services/notificationService");

const getAllNotificationsController = async (req, res) => {
  try {
    const data = await getNotifications();
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllReadController = async (req, res) => {
  try {
    const data = await markAllNotificationsRead();
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markSingleReadController = async (req, res) => {
  try {
    const data = await markNotificationRead(req.params.id);
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllNotificationsController,
  markAllReadController,
  markSingleReadController,
};
