const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Review = require("./review");
const Product = require("./product");

const { Schema } = mongoose;

/**
 * @swagger
 *  components:
 *    schemas:
 *      User:
 *        required:
 *          -
 *          - username
 *          - email
 *          - password
 *          - name
 *        properties:
 *          isVerified:
 *            type: boolean
 *            description: Check if email is verified.
 *          pushToken:
 *            type: string
 *            description: Expo push token of the user.
 *          username:
 *            type: string
 *            description: Username for the user, needs to be unique and up to 16 characters.
 *          email:
 *            type: string
 *            description: Email for the user, needs to be unique.
 *          password:
 *            type: string
 *            description: Needs to be betwen 8 and 16 characters.
 *          name:
 *            type: string
 *            description: Name for the user, up to 20 characters.
 *          profilePic:
 *            type: string
 *            description: Profile picture image url, defaults to https://i.imgur.com/tiRSkS8.jpg.
 *          description:
 *            type: string
 *            description: Up to 250 characters.
 *          location:
 *            type: string
 *            description: Up to 60 characters.
 *          products:
 *            type: array[productId]
 *          likes:
 *            type: array[likeId]
 *          followers:
 *            type: array[userId]
 *          following:
 *            type: array[userId]
 *          chats:
 *            type: array[chatId]
 */
const userSchema = new Schema(
  {
    isVerified: { type: Boolean, default: false },
    pushToken: { type: String, default: "" },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    profilePic: { type: String, default: "https://i.imgur.com/tiRSkS8.jpg" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    followers: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    following: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    chats: [{ type: mongoose.Types.ObjectId, required: true, ref: "Chat" }],
  },
  { timestamps: true }
);

// Methods //
userSchema.methods.getReviewRating = async function () {
  const userId = this._id;
  const reviews = await Review.find({ reviewed: userId });

  //TODO: calculate review rating
  return 0;
};

userSchema.methods.getProducts = async function () {
  const userId = this._id;
  const products = await Product.find({ creator: userId });

  return products;
};

userSchema.plugin(uniqueValidator);
module.exports = mongoose.model("User", userSchema);
