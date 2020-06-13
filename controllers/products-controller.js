const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Product = require("../models/product");
const User = require("../models/user");
const productPipeline = require("../controllers/pipelines/products-search");

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

  let userWithProducts;
  try {
    userWithProducts = await User.findById(userId).populate("products");
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithProducts || userWithProducts.products.length === 0) {
    const error = new HttpError("Could not find product for user id", 404);
    return next(error);
  }

  res.json({
    products: userWithProducts.products.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

// read products/product by user id
const getAllProducts = async (req, res, next) => {
  const userId = req.params.uid;

  let availableProducts;
  try {
    availableProducts = await Product.find({ creator: { $ne: userId } });
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  if (!availableProducts || availableProducts.length === 0) {
    const error = new HttpError("Could not find any products", 404);
    return next(error);
  }

  res.status(200).json({
    products: availableProducts.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

// search for products
const searchForProducts = async (req, res, next) => {
  const query = req.params.query;
  productPipeline[0].$search.text.query = query;

  let aggCursor;
  try {
    aggCursor = await Product.aggregate(productPipeline);
  } catch (err) {
    const error = new HttpError(
      "Fetching products failed, please try again later",
      500
    );
    return next(error);
  }

  const searchedProducts = [];
  aggCursor.forEach((product) => searchedProducts.push(product));

  if (searchedProducts.length === 0) {
    const error = new HttpError("Could not find any products", 404);
    return next(error);
  }

  res.status(200).json({
    products: searchedProducts,
  });
};

// create product
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
    likes: [],
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating product failed, please try again",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProduct.save({ session: sess });
    user.products.push(createdProduct);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Failed to create product, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ product: createdProduct.toObject({ getters: true }) });
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
    product = await Product.findById(productId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  if (!product) {
    const error = new HttpError("Could not find product for this id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await product.remove({ session: sess });
    product.creator.products.pull(product);
    await product.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch {
    const error = new HttpError(
      "Something went wrong, could not delete product.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Product" });
};

// like product
const likeProduct = async (req, res, next) => {
  const { userId } = req.body;
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

  if (!product) {
    const error = new HttpError("Could not find product for this id", 404);
    return next(error);
  }

  product.likes.push(userId);

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, please try again later",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for this user id", 404);
    return next(error);
  }

  try {
    await product.save();
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Could not like item, please try again later",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Liked Product", user });
};

// unlike product
const unlikeProduct = async (req, res, next) => {
  const { userId } = req.body;
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

  if (!product) {
    const error = new HttpError("Could not find product for this id", 404);
    return next(error);
  }

  product.likes.pull(userId);

  try {
    await product.save();
  } catch (err) {
    const error = new HttpError(
      "Could not unlike item, please try again later",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "unLiked Product" });
};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.getAllProducts = getAllProducts;
exports.searchForProducts = searchForProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.likeProduct = likeProduct;
exports.unlikeProduct = unlikeProduct;
