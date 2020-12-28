const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// get routes
router.get("/product/:pid", usersController.getLikedUsers);
router.get("/:uid", usersController.getUserById);
router.get("/search/:query", usersController.searchForUsers);

// post routes
router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
    check("username").isLength({ max: 15 }),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

// patch routes
router.patch("/follow/:uid", usersController.followUser);
router.patch("/unfollow/:uid", usersController.unfollowUser);

router.use(checkAuth);
router.patch("/:uid", usersController.updateUser);

module.exports = router;
