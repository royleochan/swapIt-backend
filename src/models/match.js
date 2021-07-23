const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const matchSchema = new Schema(
  {
    productOneId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    productTwoId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    isConfirmed: { type: Boolean, required: true, default: false },
    productOneIsRequested: { type: Boolean, required: true, default: false },
    productTwoIsRequested: { type: Boolean, required: true, default: false },
    productOneIsReviewed: { type: Boolean, required: true, default: false },
    productTwoIsReviewed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
