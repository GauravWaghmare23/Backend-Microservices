const logger = require('../utils/logger.js')

const errorHandler = (err,req,res,next) => {
  logger.error(err.message);
  res.
    status(err.status || 500)
    .json({message : err.message || "Internal server error"});
  next();
};

module.exports = errorHandler;
