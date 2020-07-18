const express = require("express");
const { check } = require("express-validator");

const notificationsController = require("../controllers/notifications-controller");

const router = express.Router();

router.get("/:uid", notificationsController.getNotificationsByUserId);

router.post(
  "/",
  [check("description").not().isEmpty()],
  notificationsController.createNotification
);

module.exports = router;
