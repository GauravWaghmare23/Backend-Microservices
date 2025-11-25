require("dotenv").config();
const express = require("express");
const app = express();
const logger = require("./utils/logger");
const connectDb = require("./config/connectDb");
const helmet = require('helmet');
const cors = require('cors');


//connect database
connectDb();

// middlewares

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});


