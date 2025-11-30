require('dotenv').config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require('cors');
const connectDb = require('./config/connectDb.js');
const cookieParser = require('cookie-parser');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { rateLimit} = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const routes = require('./routes/media.route.js');
const errorHandler = require('./middlewares/errorHandler.middleware.js');
const logger = require('./utils/logger.js');

// connect database
connectDb();

// assigning

const redisClient = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT || 3003;


// middlewares

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());


// logs

app.use(async (req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

// rate limiter flexibler (RateLimiterRedis)

const rateLimiting = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
});

app.use(async(req, res, next) => {
    try {
        await rateLimiting.consume(req.ip);
        next();
    } catch (error) {
        logger.warn(`Rate limit far exceeded for IP: ${req.ip}`);
        return res.status(429).json({success: false, message: "Too many request"});
    }
})


// sensitive data rate limiter

const sensitiveEndpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Endpoint rate limit far exceeded for IP: ${req.ip}`);
        res.status(429).json({success: false, message: "Too many request"});
    },
    store: new RedisStore({
        sendCommand:(...args) => redisClient.call(...args)
    })
})

app.use('/api/media/upload',sensitiveEndpointLimiter);


//routes
app.use('/api/media', routes);

// error handler middleware
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Media Server running on port http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason,promise) => { // for unhandled promise rejections
    logger.error("Unhandled rejection at promise", promise, "reason : ", { reason });
});