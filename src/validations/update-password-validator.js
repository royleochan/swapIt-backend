const { check } = require("express-validator");

const updatePasswordValidationRules = () => {
  return [
    check("newPassword")
      .trim()
      .isLength({ min: 8, max: 16 })
      .withMessage("Password must be between 8 and 16 characters"),
  ];
};

module.exports = {
  updatePasswordValidationRules,
};
