const express = require("express");

const chatsController = require("../controllers/chats-controller");

const router = express.Router();
// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /chats/rooms/{uid}:
 *   get:
 *     summary: Retrieve a list of active chat rooms with given uid
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: uid of the user
 *     responses:
 *       "200":
 *         description: An array of active chat rooms of the user
 */
router.get("/rooms/:uid", chatsController.getAllChatRooms);
/**
 * @swagger
 *
 * /chats/{rid}:
 *   get:
 *     summary: Retrieve a single chat room based on its chat id
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: rid
 *         schema:
 *           type: string
 *         required: true
 *         description: rid of the chat room
 *     responses:
 *       "200":
 *         description: An active chat rooms with the given rid
 */
router.get("/:rid", chatsController.getChatRoomById);
/**
 * @swagger
 *
 * /chats/{uid1}/{uid2}:
 *   get:
 *     summary: Retrieve a chat room between two users
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: uid1
 *         schema:
 *           type: string
 *         required: true
 *         description: uid of the first user
 *       - in: path
 *         name: uid2
 *         schema:
 *           type: string
 *         required: true
 *         description: uid of the second user
 *     responses:
 *       "200":
 *         description: An active chat room between two users
 */
router.get("/:uid1/:uid2", chatsController.findMatchingRoom);

module.exports = router;
