const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    logger.error('MONGODB_URI is not defined in post-service');
    throw new Error('MONGODB_URI is not defined in post-service');
}

const connectDb = async () => {
    try {
        await mongoose.connect(MONGODB_URI).then(() => {
            logger.info('Connected to MongoDB in post-service');
        }).catch((error) => {
            logger.error(`Error connecting to MongoDB post-service: ${error.message}`);
        })
    } catch (error) {
        logger.error(`Error connecting to MongoDB post-service : ${error.message}`);
        console.error(`Error connecting to MongoDB post-service : ${error.message}`);
        throw new Error(`Error connecting to MongoDB post-service: ${error.message}`);
        process.exit(1);
    }
};

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed on app termination");
  process.exit(0);
});

module.exports = connectDb;