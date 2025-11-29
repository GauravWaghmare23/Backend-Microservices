const PostModel = require("../models/post.model.js");
const logger = require("../utils/logger.js");


async function invalidatePostsCache(req) {
    const keys = await req.redisClient.keys("posts:*");
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    logger.info("create post endpoint hit");
    try {
        const { title, content, mediaUrls } = req.body;
        
        const newPost = new PostModel({
            user: req.user.userId || req.user._id,
            title: title,
            content: content,
            mediaUrls: mediaUrls,
        });

        await newPost.save()

        logger.info("Post created successfully");
        invalidatePostsCache(req);
        return res.status(201).json({ message: "Post created successfully", post: newPost });

    } catch (error) {
        logger.warn(`create post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        return res.status(500).json({ message: message });
    }
};

const getAllPosts = async (req, res) => {
    logger.info("get all posts endpoint hit");
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        logger.info(`Fetching posts from cacheKey : posts:${page} :${limit}`);
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            logger.info("Posts fetched from cache");
            return res.status(200).json(JSON.parse(cachedPosts));
        }

        const posts = await PostModel.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);

        const totalNoOfPosts = await PostModel.countDocuments({});
        const totalPages = Math.ceil(totalNoOfPosts / limit);

        const result = {
            posts: posts,
            currentPage: page,
            totalPages: totalPages,
            totalNoOfPosts: totalNoOfPosts,
        };

        await req.redisClient.setex(cacheKey, 60, JSON.stringify(result));
        logger.info("Posts fetched successfully");
        return res.status(200).json(result);
    } catch (error) {
        logger.warn(`get all posts error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        return res.status(500).json({ message: message });
    }
};


const getPost = async (req, res) => {
    logger.info("get post endpoint hit");
    try {
        
    } catch (error) {
        logger.warn(`get post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        res.status(500).json({ message: message });
    }
};

const deletePost = async (req, res) => {
    logger.info("delete post endpoint hit");
    try {
        
    } catch (error) {
        logger.warn(`delete post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        res.status(500).json({ message: message });
    }
};

const updatePost = async (req, res) => {
    logger.info("update post endpoint hit");
    try {
        
    } catch (error) {
        logger.warn(`update post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        res.status(500).json({ message: message });
    }
};


const likePostToggle = async (req, res) => {
    logger.info("like toggle endpoint hit");
    try {
        
    } catch (error) {
        logger.warn(`like post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        res.status(500).json({ message: message });
    }
};


const commentPost = async (req, res) => {
    logger.info("comment post endpoint hit");
    try {
        
    } catch (error) {
        logger.warn(`comment post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        res.status(500).json({ message: message });
    }
};

const deleteCommentPost = async (req, res) => {
    logger.info("delete comment post endpoint hit");
    try {
        
    } catch (error) {
        logger.warn(`delete comment post error: ${error.message}`);
        const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;
        res.status(500).json({ message: message });
    }
};

module.exports = {
    createPost,
    getAllPosts
};