const express = require('express');
const { createPost, getAllPosts, getPost, updatePost, deletePost, likePostToggle, commentPost, deleteCommentPost } = require('../controllers/post.controller.js');
const authenticationMiddleware = require('../middlewares/auth.middlerware.js');
const router = express.Router();


router.use(authenticationMiddleware);
router.post('/create', createPost);
router.get('/all-posts', getAllPosts);
router.get('/:id', getPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.get('/likes/:id', likePostToggle);
router.post('/comment/:id', commentPost);
router.delete('/comment/:postId/:commentId', deleteCommentPost);



module.exports = router;