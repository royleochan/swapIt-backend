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
    isConfirmed: { type: Boolean, required: true },
    productOneIsRequested: { type: Boolean, required: true },
    productTwoIsRequested: { type: Boolean, required: true },
    productOneIsReviewed: { type: Boolean, required: true },
    productTwoIsReviewed: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", productSchema);
