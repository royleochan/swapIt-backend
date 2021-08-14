//---- Imports ----//
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { generateOtp, checkOtpExpired } = require("../services/otp");
const { sendOtpEmail } = require("../services/mail");

const Otp = require("../models/otp");
const User = require("../models/user");
const HttpError = require("../models/http-error");

const { addMinutesToDate, getCurrentDate } = require("../utils/date");

const getOtp = async (req, res, next) => {
  const { email, type } = req.body;
  const isVerifyEmail = type === "email";

  try {
    const userArr = await User.find({ email: email });

    if (!userArr || userArr.length === 0) {
      const error = new HttpError(
        "There is no registered user with the given email address, please try a different email.",
        404
      );
      return next(error);
    }

    const { _id, name } = userArr[0];
    const otpValue = generateOtp();

    const createdOtp = new Otp({
      value: otpValue,
      expirationTime: addMinutesToDate(getCurrentDate(), 2),
      verified: false,
      userId: _id,
    });

    await createdOtp.save();

    const emailSubject = isVerifyEmail
      ? `Confirm your email address with ${otpValue}`
      : `Reset your password with ${otpValue}`;

    await sendOtpEmail(
      process.env.SWAPIT_EMAIL_ADDR,
      email,
      isVerifyEmail,
      emailSubject,
      otpValue,
      name
    );

    res.json({
      message: "Otp sent",
      userId: _id,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not send OTP", 500);
    return next(error);
  }
};

const verifyOtpForEmail = async (req, res, next) => {
  const { uid, otpValue } = req.body;

  try {
    const otps = await Otp.find({
      userId: uid,
      verified: false,
    }).sort({
      createdAt: -1,
    });

    if (!otps || otps.length === 0) {
      const error = new HttpError(
        "Could not verify OTP, please try again.",
        400
      );
      return next(error);
    }

    const otp = otps[0];
    if (otpValue !== otp.value) {
      const error = new HttpError("Wrong OTP, please try again.", 400);
      return next(error);
    }

    if (checkOtpExpired(otp.expirationTime)) {
      const error = new HttpError("OTP expired, please try again.", 400);
      return next(error);
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Otp.deleteMany({ userId: uid });
    const user = await User.findById(uid);
    user.isVerified = true;
    await user.save({ session: sess });
    await sess.commitTransaction();

    res.json({
      user: user.toObject({ getters: true }),
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not verify OTP", 500);
    return next(error);
  }
};

const verifyOtpForPassword = async (req, res, next) => {
  const { uid, otpValue, newPassword, newPasswordConfirm } = req.body;

  try {
    const otps = await Otp.find({
      userId: uid,
      verified: false,
    }).sort({
      createdAt: -1,
    });

    if (!otps || otps.length === 0) {
      const error = new HttpError(
        "Could not verify OTP, please try again.",
        400
      );
      return next(error);
    }

    const otp = otps[0];
    if (otpValue !== otp.value) {
      const error = new HttpError("Wrong OTP, please try again.", 400);
      return next(error);
    }

    if (checkOtpExpired(otp.expirationTime)) {
      const error = new HttpError("OTP expired, please try again.", 400);
      return next(error);
    }

    if (newPassword !== newPasswordConfirm) {
      const error = new HttpError("New passwords do not match.", 422);
      return next(error);
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    const user = await User.findById(uid);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save({ session: sess });
    await Otp.deleteMany({ userId: uid });
    await sess.commitTransaction();

    res.json({
      message: "Password Changed!",
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not reset password", 500);
    return next(error);
  }
};

exports.getOtp = getOtp;
exports.verifyOtpForEmail = verifyOtpForEmail;
exports.verifyOtpForPassword = verifyOtpForPassword;
