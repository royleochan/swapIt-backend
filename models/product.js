const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  maxPrice: { type: Number, required: true },
  minPrice: { type: Number, required: true },
  creator: { type: String, required: true },
});

module.exports = mongoose.model("Product", productSchema);