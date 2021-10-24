const express = require("express");

const recommenderControllers = require("../controllers/recommender-controller");

const router = express.Router();

// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /recommender/users/{uid}:
 *   get:
 *     summary: Retrieves recommended users
 *     tags: [Recommender]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user
 *     responses:
 *       "200":
 *         description: List of users to recommend
 */
router.get("/users/:uid", recommenderControllers.getRecommendedUsers);

/**
 * @swagger
 *
 * /recommender/products/{uid}:
 *   get:
 *     summary: Retrieves recommended products
 *     tags: [Recommender]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user
 *     responses:
 *       "200":
 *         description: List of products to recommend
 */
router.get("/products/:uid", recommenderControllers.getRecommendedProducts);

module.exports = router;