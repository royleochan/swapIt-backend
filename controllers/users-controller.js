const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const sendPushNotification = require("../services/pushNotification");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Product = require("../models/product");
const Notification = require("../models/notification");
const userPipeline = require("../controllers/pipelines/user-search");

const getLikedUsers = async (req, res, next) => {
  const { pid } = req.params;

  try {
    const users = await Product.findById(pid, "likes");
    res.json({ users });
  } catch (err) {
    const error = new HttpError(
      "Could not find users who like the product",
      404
    );
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const user = await User.findById(uid).populate("products");
    res.json({ user: user.toObject({ getters: true }) });
  } catch (err) {
    const error = new HttpError("Could not find user for this user id", 404);
    return next(error);
  }
};

const getFollowingUsers = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const result = await User.findById(uid, "following")
      .populate("following")
      .map((user) => user.toObject({ getters: true }));
    res.json({ result });
  } catch (err) {
    const error = new HttpError("Could not find following", 404);
    return next(error);
  }
};

const getFollowersUsers = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const result = await User.findById(uid, "followers")
      .populate("followers")
      .map((user) => user.toObject({ getters: true }));
    res.json({ result });
  } catch (err) {
    const error = new HttpError("Could not find followers", 404);
    return next(error);
  }
};

const searchForUsers = async (req, res, next) => {
  const { query, uid } = req.params;
  userPipeline.usernamePipeline[0].$search.autocomplete.query = query;
  // atlas autocomplete search on username field
  try {
    const aggCursor = await User.aggregate(userPipeline.usernamePipeline);
    const searchedUsers = [];
    aggCursor.forEach((user) => {
      if (user._id.toString() !== uid) {
        searchedUsers.push(user);
      }
    });

    if (searchedUsers.length === 0) {
      const error = new HttpError("Could not find any users", 404);
      return next(error);
    }

    res.status(200).json({
      users: searchedUsers.map((user) => {
        return { ...user, id: user._id };
      }),
    });
  } catch (err) {
    const error = new HttpError("No users found", 500);
    return next(error);
  }
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, password, username, profilePic, description, location } =
    req.body;

  let existingUser;
  let existingUsername;
  try {
    existingUser = await User.findOne({ email: email });
    existingUsername = await User.findOne({ username: username });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser || existingUsername) {
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
      "Could not create password, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    username,
    email,
    ...(profilePic !== undefined && { profilePic }),
    ...(description !== undefined && { description }),
    ...(location !== undefined && { location }),
    password: hashedPassword,
    products: [],
    likes: [],
    followers: [],
    following: [],
    chats: [],
    notifications: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  // Generate jwt token
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

  // Generate jwt token
  try {
    token = jwt.sign({ user: existingUser }, `${process.env.SECRET_KEY}`);
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    user: existingUser.toObject({ getters: true }),
    token: token,
  });
};

const updateUser = async (req, res, next) => {
  const { name, username, profilePic, description, location } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a user.",
      500
    );
    return next(error);
  }

  user.name = name;
  user.username = username;
  user.profilePic = profilePic;
  user.description = description;
  user.location = location;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update a user.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

const followUser = async (req, res, next) => {
  const { loggedInUserId } = req.body;
  const targetUserId = req.params.uid;

  let loggedInUser;
  let targetUser;
  try {
    loggedInUser = await User.findById(loggedInUserId);
    targetUser = await User.findById(targetUserId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find users.",
      500
    );
    return next(error);
  }

  if (!loggedInUser.following.includes(targetUserId)) {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      loggedInUser.following.push(targetUserId);
      targetUser.followers.push(loggedInUserId);

      // Send Notification
      sendPushNotification(
        targetUser.pushToken,
        "New Follow",
        `${loggedInUser.name} followed you`
      );
      notification = new Notification({
        creator: loggedInUserId,
        targetUser: targetUserId,
        description: `${loggedInUser.name} followed you`,
        type: "FOLLOW",
        isRead: false,
      });
      await notification.save({ session: sess });
      targetUser.notifications.push(notification._id);

      await loggedInUser.save();
      await targetUser.save();
      await sess.commitTransaction();
    } catch (err) {
      const error = new HttpError(
        "Something went wrong, could not follow user.",
        500
      );
      return next(error);
    }

    res.status(200).json({ followed: targetUser.toObject({ getters: true }) });
  } else {
    const error = new HttpError("Already followed user", 400);
    return next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  const { loggedInUserId } = req.body;
  const targetUserId = req.params.uid;

  let loggedInUser;
  let targetUser;
  try {
    loggedInUser = await User.findById(loggedInUserId);
    targetUser = await User.findById(targetUserId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find users.",
      500
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    loggedInUser.following.pull(targetUserId);
    targetUser.followers.pull(loggedInUserId);
    await loggedInUser.save();
    await targetUser.save();
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not unfollow user.",
      500
    );
    return next(error);
  }

  res.status(200).json({ unfollowed: targetUser.toObject({ getters: true }) });
};

const updatePushToken = async (req, res, next) => {
  const { pushToken } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId).populate("products");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a user.",
      500
    );
    return next(error);
  }

  user.pushToken = pushToken;

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update push token.",
      500
    );
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

exports.getLikedUsers = getLikedUsers;
exports.getUserById = getUserById;
exports.getFollowingUsers = getFollowingUsers;
exports.getFollowersUsers = getFollowersUsers;
exports.searchForUsers = searchForUsers;
exports.signup = signup;
exports.login = login;
exports.updateUser = updateUser;
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;
exports.updatePushToken = updatePushToken;
