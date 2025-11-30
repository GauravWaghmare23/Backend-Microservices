const logger = require("../utils/logger.js");

const authenticationMiddleware = async (req, res, next) => {
  logger.info("Authentication middleware hit");
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      logger.warn("Access attempted without userId");
      return res
        .status(401)
        .json({
          success: false,
          message: "Unauthorized - Please login or register to continue.",
        });
    }

    req.user = {
      userId,
      _id: userId,
    };

    next();
  } catch (error) {
    logger.error(
      `Authentication middleware error in media-service: ${error.message}`
    );
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    res.status(500).json({ success: false, message: message });
  }
};


module.exports = authenticationMiddleware;