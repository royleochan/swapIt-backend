const { validationResult } = require("express-validator");
const { Expo } = require("expo-server-sdk");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Review = require("../models/review");
const User = require("../models/user");

// Create a new Expo SDK client
let expo = new Expo();

const getReviewsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithReviews;
  try {
    userWithReviews = await User.findById(userId).populate("reviews");
  } catch (err) {
    const error = new HttpError(
      "Fetching reviews failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithReviews || userWithReviews.reviews.length === 0) {
    const error = new HttpError("Could not find reviews for user id", 404);
    return next(error);
  }

  let reviewRating = userWithReviews.reviews.reduce(
    (totalReviewRating, review) => {
      return totalReviewRating + review.rating;
    },
    0
  );

  reviewRating = reviewRating / userWithReviews.reviews.length;

  const result = await Promise.all(
    userWithReviews.reviews.map(async (review) => {
      const creator = await User.findById(review.creator, {
        name: 1,
        profilePic: 1,
      });
      review.creator = creator;
      return review.toObject({ getters: true });
    })
  );

  res.json({
    reviews: result,
    reviewRating,
  });
};

const createReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const { description, creator, reviewed, rating, creatorName } = req.body;

  const createdReview = new Review({
    description,
    creator,
    reviewed,
    rating,
  });

  let userReviewed;

  try {
    userReviewed = await User.findById(reviewed);
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

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdReview.save({ session: sess });
    userReviewed.reviews.push(createdReview);
    await userReviewed.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to upload review, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    review: createdReview.toObject({ getters: true }),
  });
};

exports.createReview = createReview;
exports.getReviewsByUserId = getReviewsByUserId;
