const express = require("express");

const reportControllers = require("../controllers/reports-controller");

const router = express.Router();

/**
 * @swagger
 *
 * /reports/new:
 *   post:
 *     summary: Sends a report to user who made the report as well as SwapIt admin email
 *     tags: [Email Report Service]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - email
 *               - description
 *               - name
 *               - username
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Bug
 *               email:
 *                 type: string
 *                 example: leoroychan@gmail.com
 *               description:
 *                 type: string
 *                 example: Faced bug where cannot upload product
 *               name:
 *                 type: string
 *                 example: Roy
 *               username:
 *                 type: string
 *                 example: leoroyy
 *     responses:
 *       "201":
 *         description: The sent email information
 */
router.post("/new", reportControllers.createReport);

module.exports = router;
