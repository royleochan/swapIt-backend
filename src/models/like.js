const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Like:
 *        required:
 *          - productId
 *          - userId
 *        properties:
 *          productId:
 *            type: string
 *            description: Id of the product.
 *          userId:
 *            type: string
 *            description: Id of the user who liked the product.
 */
const likeSchema = new Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Like", likeSchema);
