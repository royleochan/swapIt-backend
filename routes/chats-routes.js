const express = require("express");

const chatsController = require("../controllers/chats-controller");

const router = express.Router();

router.get("/:rid", chatsController.getChatRoomById);

module.exports = router;
