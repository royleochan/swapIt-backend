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
 *         description: A product with relevant fields populated
 */
router.get("/users/:uid", recommenderControllers.getRecommendedUsers);

module.exports = router;