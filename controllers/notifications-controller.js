const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Notification = require("../models/notification");
const User = require("../models/user");
const notification = require("../models/notification");

const getNotificationsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId).populate("notifications");
  } catch (err) {
    const error = new HttpError(
      "Fetching reviews failed, please try again later",
      500
    );
    return next(error);
  }

  if (!user || user.notifications.length === 0) {
    const error = new HttpError(
      "Could not find notifications for user id",
      404
    );
    return next(error);
  }

  const result = await Promise.all(
    user.notifications.map(async (notification) => {
      const creator = await User.findById(notification.creator, {
        name: 1,
        profilePic: 1,
      });
      notification.creator = creator;
      return notification.toObject({ getters: true });
    })
  );

  res.json({
    notifications: result,
  });
};

const createNotification = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { title, body, creator, notified } = req.body;

  const createdNotification = new Notification({
    title,
    body,
    creator,
    notified,
  });

  let userNotified;

  try {
    userNotified = await User.findById(notified);
  } catch (err) {
    const error = new HttpError(
      "Sending notification failed, please try again",
      500
    );
    return next(error);
  }

  if (!userNotified) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(userNotified);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createNotification.save({ session: sess });
    userNotified.notifications.push(createdReview);
    await userNotified.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to send notification, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    notification: createNotification.toObject({ getters: true }),
  });
};

exports.createNotification = createNotification;
exports.getNotificationsByUserId = getNotificationsByUserId;
