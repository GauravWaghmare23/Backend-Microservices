require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const connectDb = require("./config/connectDb.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger.js");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/post.route.js");
const errorHandler = require("./middlewares/errorHandler.js");

const app = express();

// connecting database
connectDb();

//give acess varibale

const redisClient = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT || 3002;

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(async (req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    logger.warn(`Rate limit far exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many request, please try again later after 1 hour" });
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
    sendCommand: (...args) => redisClient.call(...args),
  }),
});


// applying the sensitive endpoint to the specific routes
app.use('/api/posts/create', sensitiveEndpointLimiter);
app.use("/api/posts/:id", sensitiveEndpointLimiter);
app.use("/api/posts/:id", sensitiveEndpointLimiter);
app.use("/api/posts/likes/:id", sensitiveEndpointLimiter);
app.use("/api/posts/comments/:id", sensitiveEndpointLimiter);
app.use("/api/posts/:id/comments/:commentId", sensitiveEndpointLimiter);

// routes

app.use("/api/posts", (req, res, next) => {
  req.redisClient = redisClient;
  next();
} ,routes);

// error handler middleware
app.use(errorHandler);

// port listening
app.listen(PORT, () => {
  logger.info(`Post Server running on port http://localhost:${PORT}`);
});


process.on("unhandledRejection", (reason,promise) => { // for unhandled promise rejections
    logger.error("Unhandled rejection at promise", promise, "reason : ", { reason });
});