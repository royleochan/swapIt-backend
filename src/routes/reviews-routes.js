const express = require("express");

const {
  createReviewValidationRules,
} = require("../validations/reviews-validator");

const reviewsControllers = require("../controllers/reviews-controller");

const router = express.Router();

// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /reviews/{uid}:
 *   get:
 *     summary: Retrieve a list of reviews for a user with given uid
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user to retrieve reviews for
 *     responses:
 *       "200":
 *         description: An array of reviews
 */
router.get("/:uid", reviewsControllers.getReviewsByUserId);

/**
 * @swagger
 *
 * /reviews/{uid}/{mid}:
 *   get:
 *     summary: Retrieve a unique review for given uid and mid (uid and mid uniquely identifies a review)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user
 *       - in: path
 *         name: mid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the match
 *     responses:
 *       "200":
 *         description: A review
 */
router.get("/:uid/:mid", reviewsControllers.getReviewByMatchId);

// ----------------------------- //
//          POST REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /reviews:
 *   post:
 *     summary: Creates a new review
 *     tags: [Reviews]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - rating
 *               - creator
 *               - reviewed
 *               - matchId
 *             properties:
 *               description:
 *                 type: string
 *                 example: Good experience with the swap
 *               rating:
 *                 type: number
 *                 example: 4.4
 *               creator:
 *                 type: string
 *                 example: creatorId
 *               reviewed:
 *                 type: string
 *                 example: reviewedId
 *               matchId:
 *                 type: string
 *                 example: matchId
 *     responses:
 *       "201":
 *         description: The newly created review
 */
router.post(
  "/",
  createReviewValidationRules(),
  reviewsControllers.createReview
);

module.exports = router;
