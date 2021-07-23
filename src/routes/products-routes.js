const express = require("express");

const { productValidationRules } = require("../validations/products-validator");

const productsControllers = require("../controllers/products-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:pid", productsControllers.getProductById);

router.get("/search/:query", productsControllers.searchForProducts);

router.get("/user/:uid", productsControllers.getProductsByUserId);

router.get("/all/:uid", productsControllers.getAllFollowingProducts);

router.get("/likedProducts/:uid", productsControllers.getLikedProducts);

router.get(
  "/category/:filterCategory",
  productsControllers.getCategoryProducts
);

// router.use(checkAuth);

router.post("/", productValidationRules(), productsControllers.createProduct);

router.patch(
  "/:pid",
  productValidationRules(),
  productsControllers.updateProduct
);

router.patch("/like/:pid", productsControllers.likeProduct);

router.patch("/unlike/:pid", productsControllers.unlikeProduct);

router.delete("/:pid", productsControllers.deleteProduct);

module.exports = router;
