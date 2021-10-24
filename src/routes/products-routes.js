const express = require("express");
const checkAuth = require("../middleware/check-auth");
const { productValidationRules } = require("../validations/products-validator");

const productsControllers = require("../controllers/products-controller");

const router = express.Router();

// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /products/{pid}/{uid}:
 *   get:
 *     summary: Retrieves a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: pid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the product
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user viewing the product
 *     responses:
 *       "200":
 *         description: A product with relevant fields populated
 */
router.get("/:pid/:uid", productsControllers.getProductById);

/**
 * @swagger
 *
 * /products/search/title?query=:
 *   get:
 *     summary: Retrieves a list of products which matches the query
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: search query
 *     responses:
 *       "200":
 *         description: A list of products which matches the query
 */
router.get("/search/title", productsControllers.searchForProducts);

/**
 * @swagger
 *
 * /products/user/{uid}:
 *   get:
 *     summary: Retrieves an array of products belonging to a user
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: User id of the user
 *     responses:
 *       "200":
 *         description: An array of products with relevant fields populated
 */
router.get("/user/:uid", productsControllers.getProductsByUserId);

/**
 * @swagger
 *
 * /products/all/{uid}:
 *   get:
 *     summary: Retrieves an array of products for all the users that the user is following
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: User id of the logged in user
 *     responses:
 *       "200":
 *         description: An array of products with relevant fields populated
 */
router.get("/all/:uid", productsControllers.getAllFollowingProducts);

/**
 * @swagger
 *
 * /products/likedProducts/{uid}:
 *   get:
 *     summary: Retrieves an array of products which the user has liked
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: User id of the logged in user
 *     responses:
 *       "200":
 *         description: An array of products which the user has liked
 */
router.get("/likedProducts/:uid", productsControllers.getLikedProducts);

/**
 * @swagger
 *
 * /products/category/{filterCategory}:
 *   get:
 *     summary: Retrieves an array of products belonging to a category
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: filterCategory
 *         example: Men's Tops
 *         schema:
 *           type: string
 *         required: true
 *         description: Category of product, takes a set of enum values.
 *     responses:
 *       "200":
 *         description: An array of products belonging to a category
 */
router.get(
  "/category/:filterCategory",
  productsControllers.getCategoryProducts
);

// ---------------------------------------- //
//         Authenticate Routes Below        //
// ---------------------------------------- //
router.use(checkAuth);

// ----------------------------- //
//          POST REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /products:
 *   post:
 *     summary: Creates a product
 *     tags: [Products]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *               - description
 *               - minPrice
 *               - maxPrice
 *               - creator
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Fred Perry Polo Tee
 *               imageUrl:
 *                 type: string
 *                 example: <valid image url>
 *               description:
 *                 type: string
 *                 example: Good condition
 *               minPrice:
 *                 type: number
 *                 example: 40
 *               maxPrice:
 *                 type: number
 *                 example: 60
 *               creator:
 *                 type: string
 *                 example: <valid user id>
 *               category:
 *                 type: string
 *                 example: Men's Tops
 *     responses:
 *       "201":
 *         description: The newly product
 */
router.post("/", productValidationRules(), productsControllers.createProduct);

// ----------------------------- //
//         PATCH REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /products/{pid}:
 *   patch:
 *     summary: Updates product with pid
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: pid
 *         schema:
 *           type: string
 *         required: true
 *         description: product id of the target product
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - imageUrl
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Nexus Tee
 *               description:
 *                 type: string
 *                 example: New
 *               imageUrl:
 *                 type: string
 *                 example: <valid image url>
 *               category:
 *                 type: string
 *                 example: Men's Tops
 *     responses:
 *       "200":
 *         description: Updated match object
 */
router.patch(
  "/:pid",
  productValidationRules(),
  productsControllers.updateProduct
);

/**
 * @swagger
 *
 * /products/like/{pid}:
 *   patch:
 *     summary: Likes product with pid
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: pid
 *         schema:
 *           type: string
 *         required: true
 *         description: product id of the target product
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: user id of logged in user
 *     responses:
 *       "200":
 *         description: Liked product
 */
router.patch("/like/:pid", productsControllers.likeProduct);

/**
 * @swagger
 *
 * /products/unlike/{pid}:
 *   patch:
 *     summary: Unlikes product with pid
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: pid
 *         schema:
 *           type: string
 *         required: true
 *         description: product id of the target product
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: user id of logged in user
 *     responses:
 *       "200":
 *         description: Liked product
 */
router.patch("/unlike/:pid", productsControllers.unlikeProduct);

// ------------------------------ //
//         DELETE REQUESTS        //
// ------------------------------ //
/**
 * @swagger
 *
 * /products/{pid}:
 *   delete:
 *     summary: Deletes a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: pid
 *         schema:
 *           type: string
 *         required: true
 *         description: product id of the target product
 *     responses:
 *       "200":
 *         description: Message indicating if deletion succeeded
 */
router.delete("/:pid", productsControllers.deleteProduct);

module.exports = router;
