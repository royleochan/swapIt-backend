const express = require("express");
const checkAuth = require("../middleware/check-auth");
const { productValidationRules } = require("../validations/products-validator");

const productsControllers = require("../controllers/products-controller");

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

// ---------------------------------------- //
//         Authenticate Routes Below        //
// ---------------------------------------- //
router.use(checkAuth);

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
