const express = require("express");

const {
  createReviewValidationRules,
} = require("../validations/reviews-validator");

const reviewsControllers = require("../controllers/reviews-controller");

const router = express.Router();

router.get("/:uid", reviewsControllers.getReviewsByUserId);
router.get("/:uid/:mid", reviewsControllers.getReviewByMatchId);

router.post(
  "/",
  createReviewValidationRules(),
  reviewsControllers.createReview
);

module.exports = router;
