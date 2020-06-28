const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const userPipeline = require("../controllers/pipelines/user-search");
const Product = require("../models/product");
const Review = require("../models/review");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find(
      {},
      "username email name description location products"
    );
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getLikedUsers = async (req, res, next) => {
  const prodId = req.params.pid;
  let users;
  try {
    users = await Product.findById(prodId, "likes");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later",
      500
    );
    return next(error);
  }
  res.json({ users });
};

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, please try again later",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for this user id", 404);
    return next(error);
  }

  // calculate review rating
  let reviewRating = 0;
  for (let index = 0; index < user.reviews.length; index++) {
    const reviewId = user.reviews[index];
    const review = await Review.findById(reviewId);
    reviewRating += review.rating;
  }
  reviewRating = reviewRating / user.reviews.length;

  user.reviewRating = reviewRating;

  res.json({ user: user.toObject({ getters: true }), reviewRating });
};

const searchForUsers = async (req, res, next) => {
  const query = req.params.query;
  userPipeline[0].$search.text.query = query;

  let aggCursor;
  try {
    aggCursor = await User.aggregate(userPipeline);
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later",
      500
    );
    return next(error);
  }

  const searchedUsers = [];
  aggCursor.forEach((user) => {
    searchedUsers.push(user);
  });

  if (searchedUsers.length === 0) {
    const error = new HttpError("Could not find any users", 404);
    return next(error);
  }

  await Promise.all(
    searchedUsers.map(async (user) => {
      // calculate review rating
      let reviewRating = 0;
      for (let index = 0; index < user.reviews.length; index++) {
        const reviewId = user.reviews[index];
        const review = await Review.findById(reviewId);
        reviewRating += review.rating;
      }
      user.reviewRating = reviewRating / user.reviews.length;
    })
  );

  res.status(200).json({
    users: searchedUsers,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const {
    name,
    email,
    password,
    username,
    profilePic,
    description,
    location,
  } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User already exists, please try logging in",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    username,
    email,
    profilePic,
    description,
    location,
    password: hashedPassword,
    products: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ user: createdUser }, `${process.env.SECRET_KEY}`);
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ user: createdUser.toObject({ getters: true }), token: token });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ username: username });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("USERNAME_NOT_FOUND", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("INVALID_PASSWORD", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign({ user: existingUser }, `${process.env.SECRET_KEY}`);
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  // calculate review rating
  let reviewRating = 0;
  for (let index = 0; index < existingUser.reviews.length; index++) {
    const reviewId = existingUser.reviews[index];
    const review = await Review.findById(reviewId);
    reviewRating += review.rating;
  }
  reviewRating = reviewRating / existingUser.reviews.length;

  res.status(200).json({
    user: existingUser.toObject({ getters: true }),
    token: token,
    reviewRating,
  });
};

exports.getUsers = getUsers;
exports.getLikedUsers = getLikedUsers;
exports.getUserById = getUserById;
exports.searchForUsers = searchForUsers;
exports.signup = signup;
exports.login = login;
