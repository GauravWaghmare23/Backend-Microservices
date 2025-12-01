require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const jwt = require("jsonwebtoken");
const logger = require("./utils/logger.js");
const proxy = require("express-http-proxy");
const errorHandler = require("./middlewares/errorHandler.middleware.js");
const cookieParser = require("cookie-parser");
const validateToken = require("./middlewares/validateToken.js");

const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} ${req.url}`);
  logger.info(`Body: ${JSON.stringify(req.body)}`);
  next();
});

// Rate limiting
const rateLimiting = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
app.use(rateLimiting);

const authProxyOptions = {
  proxyReqPathResolver: (req) => req.originalUrl.replace(/^\/v1/, "/api"),
  proxyErrorHandler: (err, res) => {
    logger.error(`Auth proxy error: ${err.message}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  },
  proxyReqOptDecorator: (proxyReqOpts) => {
    proxyReqOpts.headers["Content-Type"] = "application/json";
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(
      `Response received from auth services: ${proxyRes.statusCode}`
    );

    return proxyResData;
  },
};

const protectedProxyOptions = {
  proxyReqPathResolver: (req) => req.originalUrl.replace(/^\/v1/, "/api"),
  proxyErrorHandler: (err, res) => {
    logger.error(`Protected proxy error: ${err.message}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers["Content-Type"] = "application/json";
    proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(
      `Response received from protected services: ${proxyRes.statusCode}`
    );

    return proxyResData;
  },
};

const protectedUploadProxyOptions = {
  proxyReqPathResolver: (req) => req.originalUrl.replace(/^\/v1/, "/api"),
  proxyErrorHandler: (err, res) => {
    logger.error(`Protected upload proxy error: ${err.message}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
    if (!srcReq.headers["content-type"] == "multipart/form-data") {
      proxyReqOpts.headers["Content-Type"] = "application/json";
    }
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(
      `Response received from upload protected services: ${proxyRes.statusCode}`
    );

    return proxyResData;
  },
};

app.use("/v1/auth", proxy(process.env.USER_SERVICE_URL, authProxyOptions));
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, protectedProxyOptions)
);
app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, protectedUploadProxyOptions)
);
app.use(
  "/v1/search",
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, protectedProxyOptions)
);


// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on http://localhost:${PORT}`);
  logger.info(`User Service: ${process.env.USER_SERVICE_URL}`);
  logger.info(`Post Service: ${process.env.POST_SERVICE_URL}`);
  logger.info(`Media Service: ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`Search Service: ${process.env.SEARCH_SERVICE_URL}`);
});
