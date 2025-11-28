// controllers/user.controller.js
const refreshTokenModel = require("../models/refreshToken.model.js");
const userModel = require("../models/user.model.js");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken.js");
const logger = require("../utils/logger.js");
const {
  validateRegistration,
  validateLogin,
} = require("../utils/validation.js");

const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

// Register user controller
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

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User registered successfully: ${user._id}`);
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

// Login user controller
const loginUser = async (req, res) => {
  try {
    logger.info("Login endpoint hit");

    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn(`Validation failed: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      logger.warn("User not found");
      return res.status(404).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in successfully: ${user._id}`);
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message });
  }
};

// Refresh token controller
const UserRefreshToken = async (req, res) => {
  logger.info("Refresh token endpoint hit");
  try {
    const refreshToken = req.cookies.refreshToken; 

    if (!refreshToken) {
      logger.warn("Refresh token not found");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const storedRefreshToken = await refreshTokenModel.findOne({
      token: refreshToken,
    });

    if (!storedRefreshToken) {
      logger.warn("Refresh token not found in database");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userModel.findById(storedRefreshToken.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    await refreshTokenModel.deleteOne({ _id: storedRefreshToken._id });
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Refresh token created successfully.",
      accessToken,
      user: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message });
  }
};

// Logout controller
const userLogout = async (req, res) => {
  logger.info("Logout endpoint hit");
  try {
    const refreshToken = req.cookies.refreshToken; 

    if (!refreshToken) {
      logger.warn("Refresh token not found");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const storedRefreshToken = await refreshTokenModel.findOne({
      token: refreshToken,
    });

    if (!storedRefreshToken) {
      logger.warn("Refresh token not found in database");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await refreshTokenModel.deleteOne({ _id: storedRefreshToken._id });
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json({ success: true, message: "Logout successful." });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message });
  }
};

module.exports = { registerUser, loginUser, UserRefreshToken, userLogout };
