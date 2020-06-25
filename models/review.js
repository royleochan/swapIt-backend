const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  description: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the user writing the review
  reviewed: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the user being reviewed
  rating: { type: Number, required: true },
});

module.exports = mongoose.model("Review", reviewSchema);
