const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

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
 *          reviewRating:
 *            type: number
 *          products:
 *            type: array[productId]
 *          reviews:
 *            type: array[reviewId]
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
    products: [
      { type: mongoose.Types.ObjectId, required: true, ref: "Product" },
    ],
    reviewRating: { type: Number, default: 0 },
    reviews: [{ type: mongoose.Types.ObjectId, required: true, ref: "Review" }],
    likes: [{ type: mongoose.Types.ObjectId, required: true, ref: "Like" }],
    followers: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    following: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
    chats: [{ type: mongoose.Types.ObjectId, required: true, ref: "Chat" }],
  },
  { timestamps: true }
);

userSchema.plugin(uniqueValidator);
module.exports = mongoose.model("User", userSchema);
