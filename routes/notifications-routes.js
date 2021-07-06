const express = require("express");
const checkAuth = require("../middleware/check-auth");

const notificationsController = require("../controllers/notifications-controller");

const router = express.Router();

router.get("/:uid", notificationsController.getNotificationsByUserId);

router.use(checkAuth);
router.patch("/", notificationsController.markNotificationsAsRead);
router.delete(
  "/:userId/:notificationId",
  notificationsController.dismissNotification
);

module.exports = router;
