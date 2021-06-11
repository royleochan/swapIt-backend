const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Match = require("../models/match");
const User = require("../models/user");

const sendRequest = async (req, res, next) => {
  const { mid } = req.params;

  // check if already accepted another match (cannot)

  // check if a different request has already been sent (cannot)

  // check if opposing party sent a request for the same match (cannot)
};

const acceptRequest = async (req, res, next) => {
  const { mid } = req.params;

  // check if a different request has been sent (cannot)

  // check if already accepted match (cannot)
};

const cancelRequest = async (req, res, next) => {
  const { mid } = req.params;

  // check if match is already accepted (cannot cancel)

  // check if request is sent (cannot cancel nonexistent request)
};

exports.sendRequest = sendRequest;
exports.acceptRequest = acceptRequest;
exports.cancelRequest = cancelRequest;
