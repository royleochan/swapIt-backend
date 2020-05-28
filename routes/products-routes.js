const express = require("express");

const productsControllers = require("../controllers/products-controller");

const router = express.Router();

router.get("/:pid", productsControllers.getProductById);

router.get("/user/:uid", productsControllers.getProductByUserId);

router.post("/", productsControllers.createProduct);

module.exports = router;
