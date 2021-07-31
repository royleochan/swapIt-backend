const express = require("express");

const otpController = require("../controllers/otp-controller");

const router = express.Router();

// ----------------------------- //
//          GET REQUESTS         //
// ----------------------------- //
/**
 * @swagger
 *
 * /otp/generate/{uid}:
 *   get:
 *     summary: Retrieves a 6 digit OTP
 *     tags: [Otp]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: id of the user requesting for otp
 *     responses:
 *       "200":
 *         description: A 6 digit otp
 */
router.get("/generate/:uid", otpController.getOtp);

// ----------------------------- //
//          POST REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /otp/verify/email:
 *   post:
 *     summary: Verifies email
 *     tags: [Otp]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - otpValue
 *             properties:
 *               uid:
 *                 type: string
 *               otpValue:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Success
 */
router.post("/verify/email", otpController.verifyEmail);

module.exports = router;
