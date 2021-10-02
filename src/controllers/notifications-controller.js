const HttpError = require("../models/http-error");
const Notification = require("../models/notification");

const getNotificationsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let notifications;
  try {
    notifications = await Notification.find({ targetUser: userId })
      .populate({
        path: "creator productId matchedProductId",
        select: "profilePic imageUrl",
      })
      .sort({ createdAt: -1 });
  } catch (err) {
    const error = new HttpError(
      "Fetching notifications failed, please try again later",
      500
    );
    return next(error);
  }

  if (!notifications) {
    const error = new HttpError(
      "Could not find notifications for user id",
      404
    );
    return next(error);
  }

  res.json({ notifications: notifications });
};

const markNotificationsAsRead = async (req, res, next) => {
  const { userId, notificationIds } = req.body;

  try {
    notificationIds.forEach(
      async (notificationId) =>
        await Notification.updateOne(
          { isRead: false, targetUser: userId, _id: notificationId },
          { $set: { isRead: true } }
        )
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update notifications.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Marked Notifications" });
};

const dismissNotification = async (req, res, next) => {
  const { notificationId } = req.params;

  try {
    await Notification.deleteOne({ _id: notificationId });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete notification.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Notification" });
};

exports.getNotificationsByUserId = getNotificationsByUserId;
exports.markNotificationsAsRead = markNotificationsAsRead;
exports.dismissNotification = dismissNotification;
