const express = require("express");

const matchesController = require("../controllers/matches-controller");

const router = express.Router();

router.patch("/request/send/:mid", matchesController.sendRequest);
router.patch("/request/accept/:mid", matchesController.acceptRequest);
router.patch("/request/cancel/:mid", matchesController.cancelRequest);

module.exports = router;
