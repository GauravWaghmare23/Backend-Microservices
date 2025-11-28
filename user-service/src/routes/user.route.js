const express = require("express");
const {
  registerUser,
  loginUser,
} = require("../controllers/user.controller.js");
const router = express.Router();

//routes...

// user register route endpoint
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
