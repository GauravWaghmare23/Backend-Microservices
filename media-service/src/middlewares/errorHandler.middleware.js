const logger = require("../utils/logger.js");


const errorHandler = async (err, req, res, next) => {
    logger.error(err.message);
    res
        .status(err.status || 500)
        .json({ success: false, message: err.message || "Internal Server Error" });
    next();
};

module.exports = errorHandler;