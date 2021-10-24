const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const sendPushNotification = require("../services/pushNotification");
const HttpError = require("../models/http-error");
const Review = require("../models/review");
const User = require("../models/user");
const Match = require("../models/match");
const Notification = require("../models/notification");

const getReviewsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let reviews;
  try {
    reviews = await Review.find({ reviewed: userId })
      .populate({
        path: "creator",
        select: "profilePic name",
      })
      .sort({ createdAt: -1 });
  } catch (err) {
    const error = new HttpError("Failed to fetch reviews", 500);
    return next(error);
  }

  if (!reviews) {
    const error = new HttpError("Could not find reviews for user id", 404);
    return next(error);
  }

  const reviewRating =
    reviews.reduce((prev, curr) => prev + curr.rating, 0) / reviews.length;

  res.json({ reviews: reviews, reviewRating });
};

const createReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { description, creator, reviewed, rating, matchId, pid } = req.body;

  try {
    const isReviewExisting = await Review.exists({ creator, matchId });

    if (isReviewExisting) {
      const error = new HttpError("Review has already been made", 400);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Failed to fetch review", 500);
    return next(error);
  }

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
    userReviewed = await User.findById(reviewed);
    loggedInUser = await User.findById(creator);
  } catch (err) {
    console.log(err);
    const error = new HttpError("Failed to upload review", 500);
    return next(error);
  }

  if (!userReviewed || !loggedInUser) {
    const error = new HttpError("Could not find user", 404);
    return next(error);
  }

  try {
    let match;
    const sess = await mongoose.startSession();
    sess.startTransaction();
    match = await Match.findById(matchId);

    if (pid.toString() === match.productOneId.toString()) {
      match.productOneIsReviewed = true;
    } else {
      match.productTwoIsReviewed = true;
    }
    await match.save({ session: sess });
    await createdReview.save({ session: sess });

    let notification;
    notification = new Notification({
      creator: creator,
      targetUser: reviewed,
      description: `${loggedInUser.name} left you a review`,
      type: "REVIEW",
      isRead: false,
    });
    await notification.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to upload review, please try again.",
      500
    );
    return next(error);
  }

  // Send Notification (can fail)
  try {
    sendPushNotification(
      userReviewed.pushToken,
      "New Review",
      `${loggedInUser.name} left you a review`
    );
  } catch (err) {
    console.log(err.message);
  }

  res.status(201).json({
    review: createdReview.toObject({ getters: true }),
  });
};

exports.createReview = createReview;
exports.getReviewsByUserId = getReviewsByUserId;
