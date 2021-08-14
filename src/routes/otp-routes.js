const express = require("express");

const otpController = require("../controllers/otp-controller");

const router = express.Router();

// ----------------------------- //
//          POST REQUESTS        //
// ----------------------------- //
/**
 * @swagger
 *
 * /otp/generate:
 *   post:
 *     summary: Sends a 6 digit OTP to given email address
 *     tags: [Otp]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *               type:
 *                 type: string
 *                 description: generate otp for either verifying email or resetting password ('email' or 'password')
 *                 example: 'email'
 *     responses:
 *       "200":
 *         description: Success
 */
router.post("/generate", otpController.getOtp);

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
router.post("/verify/email", otpController.verifyOtpForEmail);

/**
 * @swagger
 *
 * /otp/verify/password:
 *   post:
 *     summary: Verifies otp and resets password
 *     tags: [Otp]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - otpValue
 *               - newPassword
 *               - newPasswordConfirm
 *             properties:
 *               uid:
 *                 type: string
 *               otpValue:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               newPasswordConfirm:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Success
 */
router.post("/verify/password", otpController.verifyOtpForPassword);

module.exports = router;
