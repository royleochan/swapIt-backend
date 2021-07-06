const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Notification = require("../models/notification");

const getNotificationsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let notifications;
  try {
    notifications = await User.findById(userId)
      .populate({
        path: "notifications",
        populate: {
          path: "creator productId matchedProductId",
          select: "profilePic imageUrl",
        },
        options: { sort: { createdAt: -1 } },
      })
      .select("notifications");
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

  res.json(notifications);
};

// Mark As Read
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
  const { notificationId, userId } = req.params;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find user.",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Notification.remove({ _id: notificationId });
    user.notifications.pull(notificationId);
    await user.save({ session: sess });
    await sess.commitTransaction();
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
