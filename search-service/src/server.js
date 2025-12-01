require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDb = require("./config/connectDb");
const Redis = require("ioredis");
const { RateLimiterRedis } = require('rate-limiter-flexible')
const {RedisStore} = require('rate-limit-redis');
const logger = require("./utils/logger");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const routes = require("./routes/search.routes.js");
const errorHandler = require("./middlewares/eventHandler.js");
const {rateLimit} = require('express-rate-limit');
const { handlePostCreated } = require("./eventHandlers/handlePostCreated.js");
const { handlePostDeleted } = require("../../media-service/src/eventHandlers/mediaEventHandler.js");


// connect db
connectDb();

//assigning
const app = express();
const PORT = process.env.PORT || 3004;
const redisClient = new Redis(process.env.REDIS_URL);

// middlewares

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(async(req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.query)}`);
    next();
})

// rate limiter

const ratelimiting = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
});

app.use(async (req, res, next) => {
    try {
        ratelimiting.consume(req.ip);
        next();
    } catch (error) {
        logger.warn(`Rate limit far exceeded for IP: ${req.ip}`);
        return res.status(429).json({ success: false, message: "Too many request" });
    }
});

const sensitiveEndpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Endpoint rate limit far exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many request" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});


// routes

app.use("/api/search", routes);



//error handler middleware
app.use(errorHandler);

async function startServer() {
  try {
      await connectRabbitMQ();
      await consumeEvent("post.created", handlePostCreated);
      await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Search Server running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`Error connecting to RabbitMQ: ${error.message}`);
  }
}

startServer();



process.on("unhandledRejection", (reason,promise) => { // for unhandled promise rejections
    logger.error("Unhandled rejection at promise", promise, "reason : ", { reason });
});