const express = require("express");
const checkAuth = require("../middleware/check-auth");

const matchesController = require("../controllers/matches-controller");

const router = express.Router();

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
 * /matches/request/send/{mid}:
 *   patch:
 *     summary: Sends a match request
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: mid
 *         schema:
 *           type: string
 *         required: true
 *         description: mid of the target match
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *             properties:
 *               pid:
 *                 type: string
 *                 description: id of user's own product (user sending the request)
 *     responses:
 *       "200":
 *         description: Updated match object
 */
router.patch("/request/send/:mid", matchesController.sendRequest);

/**
 * @swagger
 *
 * /matches/request/accept/{mid}:
 *   patch:
 *     summary: Accepts a match request
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: mid
 *         schema:
 *           type: string
 *         required: true
 *         description: mid of the target match
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *             properties:
 *               pid:
 *                 type: string
 *                 description: id of user's own product (user accepting the request)
 *     responses:
 *       "200":
 *         description: Updated match object
 */
router.patch("/request/accept/:mid", matchesController.acceptRequest);

/**
 * @swagger
 *
 * /matches/request/cancel/{mid}:
 *   patch:
 *     summary: Cancels a match request
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: mid
 *         schema:
 *           type: string
 *         required: true
 *         description: mid of the target match
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *             properties:
 *               pid:
 *                 type: string
 *                 description: id of user's own product (user cancelling the request)
 *     responses:
 *       "200":
 *         description: Updated match object
 */
router.patch("/request/cancel/:mid", matchesController.cancelRequest);

module.exports = router;
