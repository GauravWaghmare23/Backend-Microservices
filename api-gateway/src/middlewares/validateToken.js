require("dotenv").config();
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger.js");

const validateToken = async (req, res, next) => {
  logger.info("validateToken middleware hit");

  try {
    let token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.split(" ")[1];

    if (!token) {
      logger.warn("No token provided");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token",
      });
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject("JWT token verify error error: " + err);
        else resolve(decoded);
      });
    });

    req.user = {
      userId: decoded._id,
      username: decoded.username,
      email:decoded.email
    };

    logger.info(`User authenticated: ${req.user.userId}`);
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      logger.warn(`Invalid token: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    logger.error(`Token validation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

module.exports = validateToken;
