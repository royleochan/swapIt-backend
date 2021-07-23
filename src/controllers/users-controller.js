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
    console.log(err);
    const error = new HttpError("Could not find product.", 404);
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const user = await User.findById(uid)
      .select("-password")
      .populate("products");
    res.json({ user: user.toObject({ getters: true }) });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }
};

const getFollowingUsers = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const result = await User.findById(uid, "following")
      .populate({
        path: "following",
        select: "username name profilePic",
      })
      .map((user) => user.toObject({ getters: true }));
    res.json({ result });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not find user following information.",
      404
    );
    return next(error);
  }
};

const getFollowersUsers = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const result = await User.findById(uid, "followers")
      .populate({
        path: "followers",
        select: "username name profilePic",
      })
      .map((user) => user.toObject({ getters: true }));
    res.json({ result });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not find user followers information.",
      404
    );
    return next(error);
  }
};

const searchForUsers = async (req, res, next) => {
  const { query, uid } = req.params;
  userPipeline.usernamePipeline[0].$search.autocomplete.query = query; // atlas autocomplete search on username field

  try {
    const aggCursor = await User.aggregate(userPipeline.usernamePipeline);
    const searchedUsers = [];
    aggCursor.forEach((user) => {
      if (user._id.toString() !== uid) {
        searchedUsers.push(user);
      }
    });

    if (!searchedUsers) {
      const error = new HttpError("Could not find any users", 404);
      return next(error);
    }

    res.status(200).json({
      users: searchedUsers.map((user) => {
        return { ...user, id: user._id };
      }),
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to search, please try again later.",
      500
    );
    return next(error);
  }
};

const signup = async (req, res, next) => {
  const inputErrors = validationResult(req);
  if (!inputErrors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password, username, profilePic, description, location } =
    req.body;

  try {
    let existingUser;
    let existingUsername;
    existingUser = await User.findOne({ email: email });
    existingUsername = await User.findOne({ username: username });

    if (existingUser) {
      const error = new HttpError(
        "Email already has an account, try logging in.",
        422
      );
      return next(error);
    }

    if (existingUsername) {
      const error = new HttpError(
        "Username already exists, try logging in or signup using a different username.",
        422
      );
      return next(error);
    }

    let hashedPassword;
    hashedPassword = await bcrypt.hash(password, 12);

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
    await createdUser.save();

    // Generate jwt token
    token = jwt.sign({ user: createdUser }, `${process.env.SECRET_KEY}`);

    res
      .status(201)
      .json({ user: createdUser.toObject({ getters: true }), token: token });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Sign up failed, please try again later.", 500);
    return next(error);
  }
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    let existingUser;
    existingUser = await User.findOne({ username: username });

    if (!existingUser) {
      const error = new HttpError("USERNAME_NOT_FOUND", 401);
      return next(error);
    }

    let isValidPassword = false;
    isValidPassword = await bcrypt.compare(password, existingUser.password);

    if (!isValidPassword) {
      const error = new HttpError("INVALID_PASSWORD", 401);
      return next(error);
    }

    // Generate jwt token
    token = jwt.sign({ user: existingUser }, `${process.env.SECRET_KEY}`);

    res.status(200).json({
      user: existingUser.toObject({ getters: true }),
      token: token,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Login failed, please try again later.", 500);
    return next(error);
  }
};

const logout = async (req, res, next) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    user.pushToken = "";
    await user.save();
    res.status(200).json({ Message: "Logged out successfully" });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Logout failed, please try again later.", 500);
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, username, profilePic, description, location } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  user.name = name;
  user.username = username;
  user.profilePic = profilePic;
  user.description = description;
  user.location = location;

  try {
    await user.save();

    res.status(200).json({ user: user.toObject({ getters: true }) });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Failed to update user, please try again later.",
      500
    );
    return next(error);
  }
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
    console.log(err);
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  if (!loggedInUser || !targetUser) {
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  if (!loggedInUser.following.includes(targetUserId)) {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      loggedInUser.following.push(targetUserId);
      targetUser.followers.push(loggedInUserId);

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
      console.log(err);
      const error = new HttpError(
        "Something went wrong, could not follow user.",
        500
      );
      return next(error);
    }

    // Try to send notification, can be allowed to fail
    try {
      sendPushNotification(
        targetUser.pushToken,
        "New Follow",
        `${loggedInUser.name} followed you`
      );
    } catch (err) {
      console.log(err.message);
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
    console.log(err);
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  if (!loggedInUser || !targetUser) {
    const error = new HttpError("Could not find user.", 404);
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
    console.log(err);
    const error = new HttpError("Failed to unfollow user.", 500);
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
    console.log(err);
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  user.pushToken = pushToken;

  try {
    await user.save();
    res.status(200).json({ user: user.toObject({ getters: true }) });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Failed to update push token.", 500);
    return next(error);
  }
};

const updatePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { currentPassword, newPassword, newPasswordConfirmation } = req.body;
  const userId = req.params.uid;

  if (newPassword !== newPasswordConfirmation) {
    const error = new HttpError("New passwords do not match.", 422);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user.", 404);
    return next(error);
  }

  try {
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      const error = new HttpError(
        "Current password is wrong, please try again.",
        422
      );
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Something went wrong, please try again.", 500);
    return next(error);
  }

  try {
    let hashedPassword;
    hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password successfully changed." });
  } catch (err) {
    const error = new HttpError("Failed to update password.", 500);
    return next(error);
  }
};

exports.getLikedUsers = getLikedUsers;
exports.getUserById = getUserById;
exports.getFollowingUsers = getFollowingUsers;
exports.getFollowersUsers = getFollowersUsers;
exports.searchForUsers = searchForUsers;
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.updateUser = updateUser;
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;
exports.updatePushToken = updatePushToken;
exports.updatePassword = updatePassword;
