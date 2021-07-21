const { check } = require("express-validator");

const updateUserValidationRules = () => {
  return [
    check("username")
      .trim()
      .isLength({ min: 1, max: 16 })
      .withMessage("Username must be between 1 and 16 characters"),
    check("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email"),
    check("name")
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage("Name must be between 1 and 20 characters"),
    check("description")
      .trim()
      .isLength({ min: 1, max: 250 })
      .withMessage("Description must be between 1 and 250 characters"),
    check("location")
      .trim()
      .isLength({ min: 1, max: 60 })
      .withMessage("Location must be between 1 and 60 characters"),
  ];
};

module.exports = {
  updateUserValidationRules,
};
