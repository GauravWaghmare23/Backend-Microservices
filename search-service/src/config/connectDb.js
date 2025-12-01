const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDb = async () => {
    logger.info("Mongo db connection function is hit");
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI).then(() => {
            logger.info("Connected to MongoDB in search-service");
            console.info("Connected to MongoDB in search-service");
        }).catch((error) => {
            logger.warn("Error connecting to MongoDB in search-service", { error });
            process.exit(1);
        })



    } catch (error) {
        logger.error("Error connecting to MongoDB in search-service :", { error });
        console.error("Error connecting to MongoDB in search-service :", error);
        process.exit(1);
    }
}

process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed on app termination");
    process.exit(0);
});

module.exports = connectDb;