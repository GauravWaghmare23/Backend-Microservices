const express = require("express");
const {
  registerUser,
  loginUser,
  userLogout,
  UserRefreshToken,
} = require("../controllers/user.controller.js");
const router = express.Router();

//routes...

// user register route endpoint
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/refresh", UserRefreshToken);
router.delete("/logout", userLogout);

module.exports = router;
