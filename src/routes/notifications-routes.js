const express = require("express");
const checkAuth = require("../middleware/check-auth");

const notificationsController = require("../controllers/notifications-controller");

const router = express.Router();

// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /notifications/{uid}:
 *   get:
 *     summary: Retrieve a list of notifications for a user with given uid
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user to retrieve notifications for
 *     responses:
 *       "200":
 *         description: An array of notifications
 */
router.get("/:uid", notificationsController.getNotificationsByUserId);

// ---------------------------------------- //
//         Authenticate Routes Below        //
// ---------------------------------------- //
router.use(checkAuth);

// ----------------------------- //
//         PATCH REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /notifications:
 *   patch:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
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
 *                 description: id of the logged in user
 *                 example: "60bb91722f59d800170b121a"
 *               notificationIds:
 *                 type: array
 *                 description: array of notification ids to be marked as read
 *                 example: ["id1", "id2"]
 *     responses:
 *       "200":
 *         description: Message indicating if marking succeeded
 */
router.patch("/", notificationsController.markNotificationsAsRead);

// ------------------------------ //
//         DELETE REQUESTS        //
// ------------------------------ //
/**
 * @swagger
 *
 * /notifications/{userId}/{notificationId}:
 *   delete:
 *     summary: Deletes a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the logged in user
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the notification to delete
 *     responses:
 *       "200":
 *         description: Message indicating if deletion succeeded
 */
router.delete(
  "/:userId/:notificationId",
  notificationsController.dismissNotification
);

module.exports = router;
