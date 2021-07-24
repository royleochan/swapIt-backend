const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Notification:
 *        required:
 *          - creator
 *          - targetUser
 *          - description
 *          - type
 *          - isRead
 *        properties:
 *          creator:
 *            type: string
 *            description: UserId of user that trigger the notification.
 *          targetUser:
 *            type: string
 *            description: UserId of recipient of notification.
 *          productId:
 *            type: string
 *            description: ProductId of product that trigger notification (only if relevant).
 *          matchedProductId:
 *            type: number
 *            description: ProductId of "other" product (requested / matched).
 *          description:
 *            type: string
 *            description: Description of notification.
 *          type:
 *            type: string
 *            description: Type of notification, takes on a set of valid enum values.
 *          isRead:
 *            type: boolean
 */
const notificationSchema = new Schema(
  {
    creator: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Types.ObjectId, ref: "Product" },
    matchedProductId: { type: mongoose.Types.ObjectId, ref: "Product" }, // refers to OTHER PRODUCT ID, not necessarily matched yet, can be requested
    description: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["LIKE", "REQUEST", "SWAP", "MATCH", "REVIEW", "FOLLOW"],
    },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
