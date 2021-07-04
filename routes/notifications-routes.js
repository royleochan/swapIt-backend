const express = require("express");

const notificationsController = require("../controllers/notifications-controller");

const router = express.Router();

router.get("/:uid", notificationsController.getNotificationsByUserId);

router.patch("/", notificationsController.markNotificationsAsRead);
router.delete("/", notificationsController.dismissNotification);

module.exports = router;
