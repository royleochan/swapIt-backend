const express = require("express");

const productsControllers = require("../controllers/products-controller");

const router = express.Router();

router.get("/:pid", productsControllers.getProductById);

router.get("/user/:uid", productsControllers.getProductsByUserId);

router.post("/", productsControllers.createProduct);

router.patch("/:pid", productsControllers.updateProduct);

router.delete("/:pid", productsControllers.deleteProduct);

module.exports = router;
