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

// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /users/product/{pid}:
 *   get:
 *     summary: Retrieve a list of users who likes product with given pid
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: pid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the product
 *     responses:
 *       "200":
 *         description: An array of users who like the product
 */
router.get("/product/:pid", usersController.getLikedUsers);

/**
 * @swagger
 *
 * /users/{uid}:
 *   get:
 *     summary: Retrieve a user with given uid
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user
 *     responses:
 *       "200":
 *         description: An user schema with products populated
 */
router.get("/:uid", usersController.getUserById);

/**
 * @swagger
 *
 * /users/search/{uid}/?query=:
 *   get:
 *     summary: Retrieve a list of users based on username query
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: username of user
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: user id of logged in user
 *     responses:
 *       "200":
 *         description: A list of users that matches the query
 */
router.get("/search/:uid", usersController.searchForUsers);

/**
 * @swagger
 *
 * /users/following/{uid}:
 *   get:
 *     summary: Retrieve a list of users which user with uid is following
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: user id of logged in user
 *     responses:
 *       "200":
 *         description: A list of users that the user is following
 */
router.get("/following/:uid", usersController.getFollowingUsers);

/**
 * @swagger
 *
 * /users/followers/{uid}:
 *   get:
 *     summary: Retrieve a list of followers for user with uid
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: user id of logged in user
 *     responses:
 *       "200":
 *         description: A list of followers for the user
 */
router.get("/followers/:uid", usersController.getFollowersUsers);

// ----------------------------- //
//          POST REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /users/signup:
 *   post:
 *     summary: Creates a new user
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Roy
 *               email:
 *                 type: string
 *                 example: roy@gmail.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *               username:
 *                 type: string
 *                 example: leoroyy
 *               profilePic:
 *                 type: string
 *                 example: https://i.imgur.com/tiRSkS8.jpg
 *               description:
 *                 type: string
 *                 example: I love swapping
 *               location:
 *                 type: string
 *                 example: Tampines
 *     responses:
 *       "201":
 *         description: The newly created user
 */
router.post("/signup", createUserValidationRules(), usersController.signup);

/**
 * @swagger
 *
 * /users/login:
 *   post:
 *     summary: Authenticates an existing user
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: leoroyy
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       "200":
 *         description: The logged in user with bearer token
 */
router.post("/login", usersController.login);

/**
 * @swagger
 *
 * /users/logout:
 *   post:
 *     summary: Logs out a user
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60bb91722f59d800170b121a
 *     responses:
 *       "200":
 *         description: Message indicating success
 */
router.post("/logout", usersController.logout);

// ---------------------------------------- //
//         Authenticate Routes Below        //
// ---------------------------------------- //
// router.use(checkAuth);

// ----------------------------- //
//         PATCH REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /users/follow/{uid}:
 *   patch:
 *     summary: Follows a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the target user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loggedInUserId
 *             properties:
 *               loggedInUserId:
 *                 type: string
 *                 description: id of the logged in user
 *     responses:
 *       "200":
 *         description: User that is followed
 */
router.patch("/follow/:uid", usersController.followUser);

/**
 * @swagger
 *
 * /users/unfollow/{uid}:
 *   patch:
 *     summary: Unfollows a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the target user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loggedInUserId
 *             properties:
 *               loggedInUserId:
 *                 type: string
 *                 description: id of the logged in user
 *     responses:
 *       "200":
 *         description: User that is unfollowed
 */
router.patch("/unfollow/:uid", usersController.unfollowUser);

/**
 * @swagger
 *
 * /users/{uid}:
 *   patch:
 *     summary: Updates user information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the logged in user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - profilePic
 *               - description
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: Roy Chan
 *               username:
 *                 type: string
 *                 example: leoroyy
 *               profilePic:
 *                 type: string
 *                 example: https://i.imgur.com/tiRSkS8.jpg
 *               description:
 *                 type: string
 *                 example: I love swapping
 *               location:
 *                 type: string
 *                 example: Tampines
 *     responses:
 *       "200":
 *         description: Updated user
 */
router.patch("/:uid", updateUserValidationRules(), usersController.updateUser);

/**
 * @swagger
 *
 * /users/pushToken/{uid}:
 *   patch:
 *     summary: Updates expo push notification token for user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the logged in user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pushToken
 *             properties:
 *               pushToken:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Message indicating push token successfully updated
 */
router.patch("/pushToken/:uid", usersController.updatePushToken);

/**
 * @swagger
 *
 * /users/password/{uid}:
 *   patch:
 *     summary: Changes password for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the logged in user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - newPasswordConfirmation
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               newPasswordConfirmation:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Message indicating password successfully changed
 */
router.patch(
  "/password/:uid",
  updatePasswordValidationRules(),
  usersController.updatePassword
);

module.exports = router;
