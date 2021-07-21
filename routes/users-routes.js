const express = require("express");

const {
  createUserValidationRules,
} = require("../validations/create-user-validator");
const {
  updateUserValidationRules,
} = require("../validations/update-user-validator");
const {
  updatePasswordValidationRules,
} = require("../validations/update-password-validator");

const usersController = require("../controllers/users-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// get routes
router.get("/product/:pid", usersController.getLikedUsers);
router.get("/:uid", usersController.getUserById);
router.get("/search/:query/:uid", usersController.searchForUsers);
router.get("/following/:uid", usersController.getFollowingUsers);
router.get("/followers/:uid", usersController.getFollowersUsers);

// post routes
router.post("/signup", createUserValidationRules(), usersController.signup);
router.post("/login", usersController.login);

// patch routes
// router.use(checkAuth);
router.patch("/follow/:uid", usersController.followUser);
router.patch("/unfollow/:uid", usersController.unfollowUser);
router.patch("/:uid", updateUserValidationRules(), usersController.updateUser);
router.patch("/pushToken/:uid", usersController.updatePushToken);
router.patch(
  "/password/:uid",
  updatePasswordValidationRules(),
  usersController.updatePassword
);

module.exports = router;
