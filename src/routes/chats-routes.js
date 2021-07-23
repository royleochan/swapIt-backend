const express = require("express");

const chatsController = require("../controllers/chats-controller");

const router = express.Router();

router.get("/rooms/:uid", chatsController.getAllChatRooms);
router.get("/:rid", chatsController.getChatRoomById);
router.get("/:uid1/:uid2", chatsController.findMatchingRoom);

module.exports = router;
