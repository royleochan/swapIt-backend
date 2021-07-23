const express = require("express");

const reportControllers = require("../controllers/reports-controller");

const router = express.Router();

router.post("/new", reportControllers.createReport);

module.exports = router;
