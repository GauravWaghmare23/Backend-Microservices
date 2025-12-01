const logger = require("../utils/logger");

const errorHandler = async (err, req, res, next) => {
  logger.error(err.message);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
};

module.exports = errorHandler;