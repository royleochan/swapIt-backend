const express = require("express");

const chatController = require("../controllers/chat-controller");

const router = express.Router();

router.post("/", chatController.newChat);

router.get("/:sender/:receiver", chatController.getMessages);

router.get("/:userId", chatController.getChatRooms);

module.exports = router;
