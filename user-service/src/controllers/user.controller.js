const userModel = require("../models/user.model.js"); // Returns { accessToken, refreshToken }
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken.js");
const logger = require("../utils/logger.js");
const { validateRegistration } = require("../utils/validation.js");

const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};


// register user controller

const registerUser = async (req, res) => {
  try {
    logger.info("Registration endpoint hit");

    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn(`Validation failed: ${error.details[0].message}`);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { username, email, password } = req.body;

    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      logger.warn("User already exists");
      return res
        .status(409)
        .json({ success: false, message: "Username or email already in use" });
    }

    const user = new userModel({ username, email, password });
    await user.save();
    logger.info(`User registered successfully: ${user._id}`);

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);
    
    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      accessToken,
      user: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message });
  }
};

module.exports = { registerUser };
