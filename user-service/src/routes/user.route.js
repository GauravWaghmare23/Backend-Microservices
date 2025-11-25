const express = require("express");
const { registerUser } = require("../controllers/user.controller.js");
const router = express.Router();


//routes...

// user register route endpoint
router.post("/register", registerUser);

module.exports = router;