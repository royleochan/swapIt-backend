const HttpError = require("../models/http-error");
const User = require("../models/user");

const getNotificationsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let notifications;
  try {
    notifications = await User.findById(userId)
      .populate({
        path: "notifications",
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

exports.getNotificationsByUserId = getNotificationsByUserId;
