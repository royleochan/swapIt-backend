const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");

const router = express.Router();

router.get("/", usersController.getUsers);

router.get("/product/:pid", usersController.getLikedUsers);

router.get("/:uid", usersController.getUserById);

router.get("/search/:query", usersController.searchForUsers);

router.post(
  "/check",
  [
    check("email").normalizeEmail().isEmail(),
    check("username").isLength({ max: 15 }),
  ],
  usersController.signupValidation
);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

router.patch("/:uid", usersController.updateUser);

module.exports = router;
