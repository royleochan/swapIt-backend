const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Match = require("../models/match");
const Product = require("../models/product");

const sendRequest = async (req, res, next) => {
  const { mid } = req.params;
  const { pid } = req.body;

  try {
    const matches = await Product.findById(pid, "matches").populate({
      path: "matches",
      populate: {
        path: "match",
      },
    });

    const matchesArray = matches.matches;

    // check if already accepted another match (cannot)
    const filterAccept = matchesArray.filter((obj) => obj.match.isConfirmed);
    if (filterAccept.length > 0) {
      const error = new HttpError("Already accepted a match request", 400);
      return next(error);
    }

    // check if opposing party sent a request for the same match (cannot)
    const filterOtherParty = matchesArray.filter(
      (obj) =>
        obj.match._id.toString() === mid.toString() &&
        ((pid.toString() === obj.match.productOneId.toString() &&
          obj.match.productTwoIsRequested) ||
          (pid.toString() === obj.match.productTwoId.toString() &&
            obj.match.productOneIsRequested))
    );
    if (filterOtherParty.length > 0) {
      const error = new HttpError(
        "Other user has already sent a match request",
        400
      );
      return next(error);
    }

    // check if a request has already been sent (cannot)
    const filterRequest = matchesArray.filter(
      (obj) =>
        (pid.toString() === obj.match.productOneId.toString() &&
          obj.match.productOneIsRequested) ||
        (pid.toString() === obj.match.productTwoId.toString() &&
          obj.match.productTwoIsRequested)
    );
    if (filterRequest.length > 0) {
      const error = new HttpError("Already sent out a request.", 400);
      return next(error);
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    const matchToUpdate = await Match.findById(mid);
    pid.toString() === matchToUpdate.productOneId.toString()
      ? (matchToUpdate.productOneIsRequested = true)
      : (matchToUpdate.productTwoIsRequested = true);
    await matchToUpdate.save({ session: sess });
    await sess.commitTransaction();

    res.status(200).json(matchToUpdate.toObject({ getters: true }));
  } catch (err) {
    const error = new HttpError("Unknown error occured. Try again later.", 500);
    return next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  const { mid } = req.params;
  const { pid } = req.body;

  try {
    const matches = await Product.findById(pid, "matches").populate({
      path: "matches",
      populate: {
        path: "match",
      },
    });

    const matchesArray = matches.matches;
    // check if already accepted match (cannot)
    const filterAccept = matchesArray.filter((obj) => obj.match.isConfirmed);
    if (filterAccept.length > 0) {
      const error = new HttpError("Already accepted a match request", 400);
      return next(error);
    }

    // check if a different request has been sent (cannot)
    const filterRequest = matchesArray.filter(
      (obj) =>
        obj.match._id.toString() !== mid.toString() &&
        ((pid.toString() === obj.match.productOneId.toString() &&
          obj.match.productOneIsRequested) ||
          (pid.toString() === obj.match.productTwoId.toString() &&
            obj.match.productTwoIsRequested))
    );
    if (filterRequest.length > 0) {
      const error = new HttpError("Already sent out a request.", 400);
      return next(error);
    }

    // check if request has been sent by other user such that it can be accepted (cannot)
    const filterOtherParty = matchesArray.filter(
      (obj) =>
        obj.match._id.toString() === mid.toString() &&
        (
          (pid.toString() === obj.match.productOneId.toString() &&
            obj.match.productTwoIsRequested) ||
          (pid.toString() === obj.match.productTwoId.toString() &&
            obj.match.productOneIsRequested)
        )
    );
    if (filterOtherParty.length <= 0) {
      const error = new HttpError(
        "Cannot accept request that does not exist.",
        400
      );
      return next(error);
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    const matchToUpdate = await Match.findById(mid);
    matchToUpdate.isConfirmed = true;
    await matchToUpdate.save({ session: sess });
    await sess.commitTransaction();

    res.status(200).json(matchToUpdate.toObject({ getters: true }));
  } catch (err) {
    const error = new HttpError("Unknown error occured. Try again later.", 500);
    return next(error);
  }
};

const cancelRequest = async (req, res, next) => {
  const { mid } = req.params;
  const { pid } = req.body;

  try {
    const matches = await Product.findById(pid, "matches").populate({
      path: "matches",
      populate: {
        path: "match",
      },
    });

    const matchesArray = matches.matches;
    // check if already accepted match (cannot)
    const filterAccept = matchesArray.filter((obj) => obj.match.isConfirmed);
    if (filterAccept.length > 0) {
      const error = new HttpError("Already accepted a match request", 400);
      return next(error);
    }

    // check if request is sent (cannot cancel nonexistent request)
    const filterRequest = matchesArray.filter(
      (obj) =>
        obj.match._id.toString() === mid.toString() &&
        ((pid.toString() === obj.match.productOneId.toString() &&
          obj.match.productOneIsRequested) ||
          (pid.toString() === obj.match.productTwoId.toString() &&
            obj.match.productTwoIsRequested))
    );
    if (filterRequest.length <= 0) {
      const error = new HttpError("Cannot cancel non-existent request", 400);
      return next(error);
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    const matchToUpdate = await Match.findById(mid);
    pid.toString() === matchToUpdate.productOneId.toString()
      ? (matchToUpdate.productOneIsRequested = false)
      : (matchToUpdate.productTwoIsRequested = false);
    await matchToUpdate.save({ session: sess });
    await sess.commitTransaction();

    res.status(200).json(matchToUpdate.toObject({ getters: true }));
  } catch (err) {
    const error = new HttpError("Unknown error occured. Try again later.", 500);
    return next(error);
  }
};

exports.sendRequest = sendRequest;
exports.acceptRequest = acceptRequest;
exports.cancelRequest = cancelRequest;
