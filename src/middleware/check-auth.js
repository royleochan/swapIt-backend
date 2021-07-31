const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed!");
    }
    const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET_KEY}`);
    req.userData = { userId: decodedToken.user._id };
    next();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Authentication failed!", 401);
    return next(error);
  }
};
