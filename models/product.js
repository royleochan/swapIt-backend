const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
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
