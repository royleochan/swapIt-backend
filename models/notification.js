const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    description: { type: String, required: true },
    type: { type: String, required: true },
    userPictureUrl: { type: String, required: true },
    productPictureUrl: { type: String },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
