const express = require("express");
const authenticationMiddleware = require("../../../post-service/src/middlewares/auth.middlerware");
const { searchController } = require("../controllers/search.controller");
const router = express.Router();


router.get('/', authenticationMiddleware, searchController);

module.exports = router;