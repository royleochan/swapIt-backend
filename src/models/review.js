const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Review:
 *        required:
 *          - description
 *          - rating
 *          - creator
 *          - reviewed
 *          - matchId
 *        properties:
 *          description:
 *            type: string
 *            description: Description of the review, can be up to 255 characters.
 *          rating:
 *            type: number
 *            description: Rating for the review, must be between 0 and 5.
 *          creator:
 *            type: string
 *            description: ObjectId for the user that created the review.
 *          reviewed:
 *            type: string
 *            description: ObjectId for the reviewed user.
 *          matchId:
 *            type: string
 *            description: ObjectId for the relevant Match.
 */
const reviewSchema = new Schema(
  {
    description: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the user writing the review
    reviewed: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the user being reviewed
    rating: { type: Number, required: true, min: 0, max: 5 },
    matchId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Match",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
