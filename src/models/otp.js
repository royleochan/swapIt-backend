const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Otp:
 *        properties:
 *          value:
 *            type: string
 *          expirationTime:
 *            type: date
 *          verified:
 *            type: boolean
 *          userId:
 *            type: string
 */
const otpSchema = new Schema(
  {
    value: { type: String },
    expirationTime: {
      type: Date,
    },
    verified: { type: Boolean, default: false },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);
