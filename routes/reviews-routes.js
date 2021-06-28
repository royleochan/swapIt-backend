const express = require("express");
const { check } = require("express-validator");

const reviewsControllers = require("../controllers/reviews-controller");

const router = express.Router();

router.get("/:uid", reviewsControllers.getReviewsByUserId);
router.get("/:uid/:mid", reviewsControllers.getReviewByMatchId);

router.post(
  "/",
  [check("description").not().isEmpty()],
  reviewsControllers.createReview
);

module.exports = router;
