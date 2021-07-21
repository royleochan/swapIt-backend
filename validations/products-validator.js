const { check } = require("express-validator");

const productValidationRules = () => {
  return [
    check("title")
      .trim()
      .isLength({ min: 1, max: 16 })
      .withMessage("Title must be between 1 and 16 characters"),
    check("description")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description must be between 1 and 1000 characters"),
  ];
};

module.exports = {
  productValidationRules,
};
