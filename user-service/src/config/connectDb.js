const mongoose = require("mongoose");
const logger = require("../utils/logger");


const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const connectDb = async () => {
  try {
    const connection = await mongoose.connect(MONGODB_URI);

    connection.on("connected", () => {
      logger.info("Connected to MongoDB");
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    logger.error("Error connecting to MongoDB", { error });
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed on app termination");
  process.exit(0);
});

module.exports = connectDb;
