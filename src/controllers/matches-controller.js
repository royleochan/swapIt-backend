const mongoose = require("mongoose");

const sendPushNotification = require("../services/pushNotification");
const HttpError = require("../models/http-error");
const Notification = require("../models/notification");
const Match = require("../models/match");
const Product = require("../models/product");

const sendRequest = async (req, res, next) => {
  const { mid } = req.params;
  const { pid } = req.body; // pid is productId of user's own product (user sending the request)

  try {
    const matches = await Product.findById(
      pid,
      "matches title creator"
    ).populate({
      path: "matches",
      populate: {
        path: "match",
      },
    });

    if (!matches) {
      const error = new HttpError("Could not find matches", 404);
      return next(error);
    }

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
    const otherProduct = await Product.findById(
      pid.toString() === matchToUpdate.productOneId.toString()
        ? matchToUpdate.productTwoId
        : matchToUpdate.productOneId,
      "title creator"
    ).populate("creator");

    let notification = new Notification({
      creator: matches.creator,
      targetUser: otherProduct.creator._id,
      productId: otherProduct._id,
      matchedProductId: pid,
      description: `Your ${otherProduct.title} has a new swap request from ${matches.title}`,
      type: "REQUEST",
      isRead: false,
    });
    await notification.save({ session: sess });
    await matchToUpdate.save({ session: sess });
    await sess.commitTransaction();

    // Send Notification: can fail
    try {
      await sendPushNotification(
        otherProduct.creator.pushToken,
        "New Swap Request",
        `Your ${otherProduct.title} has a new swap request from ${matches.title}`
      );
    } catch (err) {
      console.log(err);
    }

    res.status(200).json(matchToUpdate.toObject({ getters: true }));
  } catch (err) {
    console.log(err);
    const error = new HttpError("Unknown error occured. Try again later.", 500);
    return next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  const { mid } = req.params;
  const { pid } = req.body; // pid is productId of user's own product (user accepting the request)

  try {
    const matches = await Product.findById(
      pid,
      "matches creator title"
    ).populate({
      path: "matches creator",
      populate: {
        path: "match",
      },
    });

    if (!matches) {
      const error = new HttpError("Could not find matches", 404);
      return next(error);
    }

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
      const error = new HttpError(
        "Already sent out a request. Please cancel your other request before accepting.",
        400
      );
      return next(error);
    }

    // check if request has been sent by other user such that it can be accepted (cannot)
    const filterOtherParty = matchesArray.filter(
      (obj) =>
        obj.match._id.toString() === mid.toString() &&
        ((pid.toString() === obj.match.productOneId.toString() &&
          obj.match.productTwoIsRequested) ||
          (pid.toString() === obj.match.productTwoId.toString() &&
            obj.match.productOneIsRequested))
    );
    if (filterOtherParty.length <= 0) {
      const error = new HttpError(
        "Cannot accept request that does not exist. Other user might have cancelled their request. Please refresh.",
        400
      );
      return next(error);
    }

    const sess = await mongoose.startSession();
    sess.startTransaction();
    const matchToUpdate = await Match.findById(mid);
    matchToUpdate.isConfirmed = true;
    const otherProduct = await Product.findById(
      pid.toString() === matchToUpdate.productOneId.toString()
        ? matchToUpdate.productTwoId
        : matchToUpdate.productOneId,
      "title creator"
    ).populate("creator");
    await matchToUpdate.save({ session: sess });

    // Mark both products as swapped
    otherProduct.isSwapped = true;
    matches.isSwapped = true;
    await otherProduct.save({ session: sess });
    await matches.save({ session: sess });

    // Create Notification For Both Users:
    let notification = new Notification({
      creator: matches.creator._id,
      targetUser: otherProduct.creator._id,
      productId: otherProduct._id,
      matchedProductId: pid,
      description: `Your ${otherProduct.title} has been swapped with ${matches.title}`,
      type: "SWAP",
      isRead: false,
    });
    await notification.save({ session: sess });

    notification = new Notification({
      creator: otherProduct.creator._id,
      targetUser: matches.creator._id,
      productId: pid,
      matchedProductId: otherProduct._id,
      description: `Your ${matches.title} has been swapped with ${otherProduct.title}`,
      type: "SWAP",
      isRead: false,
    });
    await notification.save({ session: sess });

    await sess.commitTransaction();

    // Send Notification To Both Users: can fail
    try {
      await sendPushNotification(
        otherProduct.creator.pushToken,
        "Swapped Confirmed!",
        `Your ${otherProduct.title} has been swapped with ${matches.title}`
      );
      await sendPushNotification(
        matches.creator.pushToken,
        "Swapped Confirmed!",
        `Your ${matches.title} has been swapped with ${otherProduct.title} `
      );
    } catch (err) {
      console.log(err);
    }

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

    if (!matches) {
      const error = new HttpError("Could not find matches", 404);
      return next(error);
    }

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
