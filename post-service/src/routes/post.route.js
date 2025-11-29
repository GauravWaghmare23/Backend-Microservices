const express = require('express');
const { createPost, getAllPosts } = require('../controllers/post.controller.js');
const authenticationMiddleware = require('../middlewares/auth.middlerware.js');
const router = express.Router();


router.use(authenticationMiddleware);
router.post('/create', createPost);
router.get('/all-posts', getAllPosts);



module.exports = router;