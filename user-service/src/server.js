require("dotenv").config();
const express = require("express");
const app = express();
const logger = require("./utils/logger.js");
const connectDb = require("./config/connectDb.js");
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const routes = require('./routes/user.route.js')
const errorHandler = require('./middlewares/errorHandler.middleware.js')
const cookieParser = require('cookie-parser');

//connect database
connectDb();

// give variables
const redisClient = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT;


// middlewares

app.use(helmet()); // set security headers and prevent attacks from common vulnerabilities like XSS, Clickjacking, etc.
app.use(cors()); // enable CORS for all routes which allows cross-origin requests 
app.use(express.json()); // for parsing application/json 
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies and accessing them in req.cookies

app.use((req, res, next) => { // middleware to log requests 
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});


//DDoS protection and rate limitting

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient, // use default redis url format `redis://localhost:6379`
    keyPrefix: 'middleware', // key prefix for rate limiter
    points: 10, // 10 requests
    duration: 1 // per 1 second by IP
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip); // check rate limit
        next(); // if rate limit not exceeded, call next middleware
    } catch (error) {
        logger.warn(`Rate limit far exceeded for IP: ${req.ip}`);
        res.status(429).json({success: false, message: "Too many request"});
    }
});

//IP based rate limiting for sensitive data

const sensitiveEndpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Endpoint rate limit far exceeded for IP: ${req.ip}`);
        res.status(429).json({success: false, message: "Too many request"});
    },
    store: new RedisStore({ // use default redis url format `redis://localhost:6379`
        sendCommand:(...args) => redisClient.call(...args) // pass the redis client to the rate-limit-redis store
    })
});

// applying the sensitive endpoint to the routes

app.use('/api/auth/register', sensitiveEndpointLimiter);
app.use('/api/auth/login', sensitiveEndpointLimiter);
app.use('/api/auth/logout', sensitiveEndpointLimiter);



// routes

app.use('/api/auth', routes);

// error handler middleware

app.use(errorHandler);


// port listening

app.listen(PORT, () => {
    logger.info(`User Server running on port http://localhost:${PORT}`);
})

process.on("unhandledRejection", (reason,promise) => { // for unhandled promise rejections
    logger.error("Unhandled rejection at promise", promise, "reason : ", { reason });
});







