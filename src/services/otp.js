const totp = require("totp-generator");
const { getCurrentDate } = require("../utils/date");

const generateOtp = () => totp(process.env.OTP_SECRET_KEY);

const checkOtpExpired = (otpExpiryDate) => {
  return otpExpiryDate - getCurrentDate() < 0;
};

exports.generateOtp = generateOtp;
exports.checkOtpExpired = checkOtpExpired;
