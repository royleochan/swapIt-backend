const express = require("express");
const { check } = require("express-validator");

const productsControllers = require("../controllers/products-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:pid", productsControllers.getProductById);

router.get("/search/:query", productsControllers.searchForProducts);

router.get("/user/:uid", productsControllers.getProductsByUserId);

router.get("/user/all/:uid", productsControllers.getAllProducts);

router.use(checkAuth);

router.post(
  "/",
  [check("title").not().isEmpty(), check("description").not().isEmpty()],
  productsControllers.createProduct
);

router.patch("/:pid", productsControllers.updateProduct);

router.patch("/like/:pid", productsControllers.likeProduct);

router.patch("/unlike/:pid", productsControllers.unlikeProduct);

router.delete("/:pid", productsControllers.deleteProduct);

module.exports = router;
