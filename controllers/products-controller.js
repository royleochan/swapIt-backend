const { v4: uuid } = require("uuid");

const HttpError = require("../models/http-error");

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
  const product = DUMMY_PRODUCTS.find((p) => p.userId === userId);

  if (!product) {
    const error = new HttpError("Could not find place for user id", 404);
    return next(error);
  }

  res.json({ product: product });
};

const createProduct = (req, res, next) => {
  const { userId, title, imageUrl, description, minPrice, maxPrice } = req.body;
  const createdPlace = {
    id: uuid(),
    userId,
    title,
    imageUrl,
    description,
    minPrice,
    maxPrice,
  };

  DUMMY_PRODUCTS.push(createProduct);

  res.status(201).json(createdPlace);
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
