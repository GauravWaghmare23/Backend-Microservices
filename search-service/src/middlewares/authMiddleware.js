const logger = require('../utils/logger.js');

const authenticationMiddleware = async (req, res, next) => {
    logger.info('Authentication middleware hit');
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            logger.warn('Access attempted without userId');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Please login or register to continue.',
            });
        }

        req.userId = userId;
        next();
    } catch (error) {
        logger.warn(`Authentication middleware error in search-service: ${error.message}`);
        return res.status(401).json({ success: false, error: error.message });
    }
}

module.exports = authenticationMiddleware;