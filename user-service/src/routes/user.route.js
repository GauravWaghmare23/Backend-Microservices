const express = require("express");
const { registerUser } = require("../controllers/user.controller.js");
const router = express.Router();


//routes...

router.post("/register",registerUser);