const { check } = require("express-validator");

const createReviewValidationRules = () => {
  return [
    check("description")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Description must be between 1 and 255 characters"),
  ];
};

module.exports = {
  createReviewValidationRules,
};
