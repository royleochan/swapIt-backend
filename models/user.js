const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  profilePic: { type: String, default: "https://i.imgur.com/tiRSkS8.jpg" },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  products: [{ type: mongoose.Types.ObjectId, required: true, ref: "Product" }],
  reviews: [{ type: mongoose.Types.ObjectId, required: true, ref: "Review" }],
  likes: [{ type: mongoose.Types.ObjectId, required: true, ref: "Product" }],
  followers: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  following: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  chats: [{ type: mongoose.Types.ObjectId, required: true, ref: "Chat" }],
});

module.exports = mongoose.model("User", userSchema);
