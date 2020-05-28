const express = require("express");

const HttpError = require("../models/http-error");

const router = express.Router();

const DUMMY_PRODUCTS = [
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

router.get("/:pid", (req, res, next) => {
  const productId = req.params.pid;
  const product = DUMMY_PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    const error = new HttpError("Could not find place for product id", 404);
    return next(error);
  }

  res.json({ product: product });
});

router.get("/user/:uid", (req, res, next) => {
  const userId = req.params.uid;
  const product = DUMMY_PRODUCTS.find((p) => p.userId === userId);

  if (!product) {
    const error = new HttpError("Could not find place for user id", 404);
    return next(error);
  }

  res.json({ product: product });
});

module.exports = router;
