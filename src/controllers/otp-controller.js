//---- Imports ----//
const mongoose = require("mongoose");
const { generateOtp, checkOtpExpired } = require("../services/otp");
const sendEmail = require("../services/mail");
const Otp = require("../models/otp");
const User = require("../models/user");
const HttpError = require("../models/http-error");
const { addMinutesToDate, getCurrentDate } = require("../utils/date");

const getOtp = async (req, res, next) => {
  const { uid } = req.params;

  try {
    const { email } = await User.findById(uid, "email");
    const otpValue = generateOtp();

    const createdOtp = new Otp({
      value: otpValue,
      expirationTime: addMinutesToDate(getCurrentDate(), 3),
      verified: false,
      userId: uid,
    });

    await createdOtp.save();

    await sendEmail(
      process.env.SWAPIT_EMAIL_ADDR,
      email,
      `Your SwapIt verification code is ${otpValue}`,
      `Confirm your email address with ${otpValue}`
    );

    res.json({
      createdOtp,
    });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not send OTP", 500);
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
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

exports.getOtp = getOtp;
exports.verifyEmail = verifyEmail;
