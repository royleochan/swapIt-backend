const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the user triggering the notification
  notified: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the user receiving the notification
  product: { type: mongoose.Types.ObjectId, ref: "Product" }, // the user receiving the notification
});

module.exports = mongoose.model("Notification", notificationSchema);
