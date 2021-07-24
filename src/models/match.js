const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Match:
 *        required:
 *          - productOneId
 *          - productTwoId
 *          - isConfirmed
 *          - productOneIsRequested
 *          - productTwoIsRequested
 *          - productOneIsReviewed
 *          - productTwoIsReviewed
 *        properties:
 *          productOneId:
 *            type: string
 *            description: ProductId of product.
 *          productTwoId:
 *            type: string
 *            description: ProductId of other product.
 *          isConfirmed:
 *            type: boolean
 *            description: Indicates if match is confirmed.
 *          productOneIsRequested:
 *            type: bolean
 *            description: Indicates if productOne is requested.
 *          productTwoIsRequested:
 *            type: boolean
 *            description: Indicates if productTwo is requested.
 *          productOneIsReviewed:
 *            type: boolean
 *            description: Indicates if productOne is reviewed.
 *          productTwoIsReviewed:
 *            type: boolean
 *            description: Indicates if productTwo is reviewed.
 */
const matchSchema = new Schema(
  {
    productOneId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    productTwoId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    isConfirmed: { type: Boolean, required: true, default: false },
    productOneIsRequested: { type: Boolean, required: true, default: false },
    productTwoIsRequested: { type: Boolean, required: true, default: false },
    productOneIsReviewed: { type: Boolean, required: true, default: false },
    productTwoIsReviewed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
