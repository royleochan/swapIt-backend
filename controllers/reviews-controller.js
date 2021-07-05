const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const sendPushNotification = require("../services/pushNotification");
const HttpError = require("../models/http-error");
const Review = require("../models/review");
const User = require("../models/user");
const Match = require("../models/match");
const Notification = require("../models/notification");

const getReviewByMatchId = async (req, res, next) => {
  const { uid, mid } = req.params;

  let review;
  try {
    reviews = await Review.find({ creator: uid, matchId: mid });
    review = reviews[0]; // only a unique review given uid and mid
  } catch (err) {
    const error = new HttpError(
      "Fetching reviews failed, please try again later",
      500
    );
    return next(error);
  }

  if (!review) {
    const error = new HttpError("Could not find review ", 404);
    return next(error);
  }

  return res.json({
    review,
  });
};

const getReviewsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let reviews;
  try {
    reviews = await User.findById(userId)
      .populate({
        path: "reviews",
        populate: {
          path: "creator",
          select: "profilePic name",
        },
        options: { sort: { createdAt: -1 } },
      })
      .select("reviews");
  } catch (err) {
    const error = new HttpError(
      "Fetching reviews failed, please try again later",
      500
    );
    return next(error);
  }

  if (!reviews) {
    const error = new HttpError("Could not find reviews for user id", 404);
    return next(error);
  }

  res.json(reviews);
};

const createReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { description, creator, reviewed, rating, matchId, pid } = req.body;

  const createdReview = new Review({
    description,
    creator,
    reviewed,
    rating,
    matchId,
  });

  let userReviewed;
  let loggedInUser;

  try {
    userReviewed = await User.findById(reviewed).populate("reviews");
    loggedInUser = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Uploading review failed, please try again",
      500
    );
    return next(error);
  }

  if (!userReviewed) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  let match;

  const sess = await mongoose.startSession();
  sess.startTransaction();
  try {
    match = await Match.findById(matchId);
    if (pid.toString() === match.productOneId.toString()) {
      match.productOneIsReviewed = true;
    } else {
      match.productTwoIsReviewed = true;
    }
    await match.save({ session: sess });
    await createdReview.save({ session: sess });
    userReviewed.reviews.push(createdReview);
    userReviewed.reviewRating = (
      userReviewed.reviews.reduce((totalReviewRating, review) => {
        return totalReviewRating + review.rating;
      }, 0) / userReviewed.reviews.length
    ).toFixed(1);
  } catch (err) {
    const error = new HttpError(
      "Failed to upload review, please try again.",
      500
    );
    return next(error);
  }

  // Send Notification
  let notification;
  sendPushNotification(
    userReviewed.pushToken,
    "New Review",
    `${loggedInUser.name} left you a review`
  );

  notification = new Notification({
    creator: creator,
    targetUser: reviewed,
    description: `${loggedInUser.name} left you a review`,
    type: "REVIEW",
    isRead: false,
  });
  await notification.save({ session: sess });
  userReviewed.notifications.push(notification._id);

  await userReviewed.save({ session: sess });
  await sess.commitTransaction();
  res.status(201).json({
    review: createdReview.toObject({ getters: true }),
  });
};

exports.createReview = createReview;
exports.getReviewsByUserId = getReviewsByUserId;
exports.getReviewByMatchId = getReviewByMatchId;
