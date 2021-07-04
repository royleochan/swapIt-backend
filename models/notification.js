const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    creator: { type: mongoose.Types.ObjectId, ref: "User" },
    targetUser: { type: mongoose.Types.ObjectId, ref: "User" },
    productId: { type: mongoose.Types.ObjectId, ref: "Product" },
    matchedProductId: { type: mongoose.Types.ObjectId, ref: "Product" },
    description: { type: String, required: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
