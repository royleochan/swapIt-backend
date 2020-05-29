const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Product = require("../models/product");

// read product by product id
const getProductById = async (req, res, next) => {
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a product.",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError("Could not find product for product id", 404);
    return next(error);
  }

  res.json({ product: product.toObject({ getters: true }) });
};

// read products/product by user id
const getProductsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let products;
  try {
    products = await Product.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!products || products.length === 0) {
    const error = new HttpError("Could not find product for user id", 404);
    return next(error);
  }

  res.json({
    products: products.map((product) => product.toObject({ getters: true })),
  });
};

const createProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }

  const {
    title,
    imageUrl,
    description,
    minPrice,
    maxPrice,
    creator,
  } = req.body;

  const createdProduct = new Product({
    title,
    imageUrl,
    description,
    maxPrice,
    minPrice,
    creator,
  });

  try {
    createdProduct.save();
  } catch (err) {
    const error = new HttpError(
      "Failed to create product, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json(createdProduct);
};

// update product
const updateProduct = async (req, res, next) => {
  const { title, description, minPrice, maxPrice } = req.body;
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a product.",
      500
    );
    return next(error);
  }

  product.title = title;
  product.description = description;
  product.minPrice = minPrice;
  product.maxPrice = maxPrice;

  try {
    await product.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update a product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ product: product.toObject({ getters: true }) });
};

// delete product
const deleteProduct = async (req, res, next) => {
  const productId = req.params.pid;

  let product;
  try {
    product = await Product.findById(productId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  try {
    await Product.deleteOne(product);
  } catch {
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Product" });
};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
