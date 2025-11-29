const express = require('express');
const { createPost } = require('../controllers/post.controller.js');
const authenticationMiddleware = require('../middlewares/auth.middlerware.js');
const router = express.Router();


router.use(authenticationMiddleware);
router.post('/create' ,createPost);


module.exports = router;