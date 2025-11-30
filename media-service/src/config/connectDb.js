const mongoose = require('mongoose');
const logger = require('../utils/logger.js');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI).then(() => {
            logger.info('Connected to MongoDB in media-service');
        }).catch((error) => {
            logger.error(`Error connecting to MongoDB media-service: ${error.message}`);
        })
    } catch (error) {
        logger.error(`Error connecting to MongoDB media-service : ${error.message}`);
        console.error(`Error connecting to MongoDB media-service : ${error.message}`);
        throw new Error(`Error connecting to MongoDB media-service: ${error.message}`);
        process.exit(1);
    }
};

process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed on app termination");
    process.exit(0);
});

module.exports = connectDb;