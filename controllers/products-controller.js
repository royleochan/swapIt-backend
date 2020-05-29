const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Product = require("../models/product");

let DUMMY_PRODUCTS = [
  {
    id: "p1",
    userId: "u1",
    title: "White Shirt",
    imageUrl:
      "https://img1.g-star.com/product/c_fill,f_auto,h_630,q_80/v1586456245/D07205-124-110-Z04/g-star-raw-basic-t-shirt-2-pack-white-flat-front.jpg",
    description: "Plain White Tee in size S! In good condition",
    minPrice: 30,
    maxPrice: 40,
  },
];

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

const deleteProduct = (req, res, next) => {
  const productId = req.params.pid;
  DUMMY_PRODUCTS = DUMMY_PRODUCTS.filter((prod) => prod.id != productId);
  res.status(200).json({ message: "Deleted Product" });
};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
