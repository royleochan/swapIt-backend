const express = require("express");
const { check } = require("express-validator");

const productsControllers = require("../controllers/products-controller");

const router = express.Router();

router.get("/:pid", productsControllers.getProductById);

router.get("/user/:uid", productsControllers.getProductsByUserId);

router.post(
  "/",
  [check("title").not().isEmpty(), check("description").not().isEmpty()],
  productsControllers.createProduct
);

router.patch("/:pid", productsControllers.updateProduct);

router.patch("/like/:pid", productsControllers.likeProduct);

router.delete("/:pid", productsControllers.deleteProduct);

module.exports = router;
