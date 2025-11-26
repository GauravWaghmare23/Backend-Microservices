require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const logger = require("./utils/logger.js");
const proxy = require("express-http-proxy");
const errorHandler = require("./middlewares/errorHandler.middleware.js");

// assigning variables or values
const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // middleware to log requests
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// rate limiting

const rateLimiting = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Endpoint rate limit far exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many request" });
  },
  store: new RedisStore({
    // use default redis url format `redis://localhost:6379`
    sendCommand: (...args) => redisClient.call(...args), // pass the redis client to the rate-limit-redis store
  }),
});

app.use(rateLimiting);



// proxy
// Proxy options 
const proxyOptions = {
  proxyReqPathResolver: function (req) {
    return req.originalUrl.replace(/^\/v1/, '/api');
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers["Content-Type"] = "application/json";
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response received from user service: ${JSON.stringify(proxyResData)}`);
    return proxyResData;
  }
};

app.use("/v1/auth", proxy(process.env.USER_SERVICE_URL, proxyOptions));

// error handler
app.use(errorHandler);


// listen
app.listen(PORT, () => {
  logger.info(`API Gateway running on port http://localhost:${PORT}`);
    logger.info(`User Service URL: ${process.env.USER_SERVICE_URL}`);
    logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});
