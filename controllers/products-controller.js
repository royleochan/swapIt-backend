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

const getProductById = (req, res, next) => {
  const productId = req.params.pid;
  const product = DUMMY_PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    const error = new HttpError("Could not find place for product id", 404);
    return next(error);
  }

  res.json({ product: product });
};

const getProductsByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const products = DUMMY_PRODUCTS.filter((p) => p.userId === userId);

  if (!products || products.length === 0) {
    const error = new HttpError("Could not find places for user id", 404);
    return next(error);
  }

  res.json({ products: products });
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
      "Failed to create place, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json(createdProduct);
};

const updateProduct = (req, res, next) => {
  const { title, description, minPrice, maxPrice } = req.body;
  const productId = req.params.pid;

  const updatedProduct = { ...DUMMY_PRODUCTS.find((p) => p.id === productId) };
  const productIndex = DUMMY_PRODUCTS.findIndex((p) => p.id === productId);
  updatedProduct.title = title;
  updatedProduct.description = description;
  updatedProduct.minPrice = minPrice;
  updatedProduct.maxPrice = maxPrice;

  DUMMY_PRODUCTS[productIndex] = updatedProduct;

  res.status(200).json({ product: updatedProduct });
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
