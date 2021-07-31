const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * @swagger
 *  components:
 *    schemas:
 *      Product:
 *        required:
 *          - title
 *          - description
 *          - imageUrl
 *          - minPrice
 *          - maxPrice
 *          - creator
 *          - category
 *        properties:
 *          title:
 *            type: string
 *            description: Title of product, up to 32 characters.
 *          description:
 *            type: string
 *            description: Description of product, up to 1000 characters.
 *          imageUrl:
 *            type: string
 *            description: ImageUrl of product.
 *          minPrice:
 *            type: number
 *            description: Minimum price of product.
 *          maxPrice:
 *            type: number
 *            description: Maximum price of product.
 *          isSwapped:
 *            type: boolean
 *            description: Default set to false.
 *          creator:
 *            type: string
 *            description: UserId of creator.
 *          likes:
 *            type: array[userId]
 *            description: Array of user ids.
 *          matches:
 *            type: array[matchId]
 *            description: Array of match ids.
 *          category:
 *            type: string
 *            description: Category of product, takes on a set of fixed enum values.
 */
const productSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    isSwapped: { type: Boolean, default: false },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    matches: [
      {
        match: { type: mongoose.Types.ObjectId, ref: "Match" },
        product: { type: mongoose.Types.ObjectId, ref: "Product" },
      },
    ],
    category: {
      type: String,
      required: true,
      enum: [
        "Women's Tops",
        "Women's Pants, Jeans & Shorts",
        "Women's Skirts",
        "Women's Rompers, Dresses & Jumpsuits",
        "Women's Outerwear",
        "Men's Tops",
        "Men's Pants, Jeans & Shorts",
        "Men's Outerwear",
        "Others",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
