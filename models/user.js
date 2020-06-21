const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  profilePic: { type: String },
  description: { type: String },
  location: { type: String },
  products: [{ type: mongoose.Types.ObjectId, required: true, ref: "Product" }],
});

module.exports = mongoose.model("User", userSchema);
