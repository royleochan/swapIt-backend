const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = (req, res, next) => {};

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
    userName,
    profilePic,
    description,
    location,
  } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ emai: email });
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

  const createdUser = new User({
    name,
    userName,
    email,
    profilePic,
    description,
    location,
    password,
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = (req, res, next) => {};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
