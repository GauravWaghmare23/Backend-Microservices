const CommentModel = require("../models/comment.model.js");
const PostModel = require("../models/post.model.js");
const logger = require("../utils/logger.js");

async function invalidatePostsCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

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

    await newPost.save();

    logger.info("Post created successfully");
    invalidatePostsCache(req, newPost._id.toString());
    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    logger.warn(`create post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message: message });
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
      const result = JSON.parse(cachedPosts);
      return res.status(200).json({
        success: true,
        message: "Posts fetched successfully",
        data: result,
      });
    }

    const posts = await PostModel.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await PostModel.countDocuments({});
    const totalPages = Math.ceil(totalNoOfPosts / limit);

    const result = {
      posts: posts,
      currentPage: page,
      totalPages: totalPages,
      totalNoOfPosts: totalNoOfPosts,
    };

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    logger.info("Posts fetched successfully");
    return res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: result,
    });
  } catch (error) {
    logger.warn(`get all posts error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message: message });
  }
};

const getPost = async (req, res) => {
  logger.info("get post endpoint hit");
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      logger.info("Post fetched from cache");
      return res.status(200).json(JSON.parse(cachedPost));
    }

    const singlePost = await PostModel.findById(postId);

    if (!singlePost) {
      logger.warn("Post not found");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePost));
    logger.info("Single Post fetched successfully");
    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: singlePost,
    });
  } catch (error) {
    logger.warn(`get post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    res.status(500).json({ success: false, message: message });
  }
};

const deletePost = async (req, res) => {
  logger.info("delete post endpoint hit");
  try {
    const postId = req.params.id;
    const userId = req.user.userId || req.user._id;
    const post = await PostModel.findById(postId);
    if (!post) {
      logger.warn("Post not found");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    if (post.user.toString() !== userId) {
      logger.warn("Unauthorized to delete this post");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized to delete this post" });
    }

    const deletedPost = await PostModel.findOneAndDelete({
      _id: postId,
      user: userId,
    });
    if (!deletedPost) {
      logger.warn("Post not found");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    logger.info("Post deleted successfully");
    invalidatePostsCache(req, deletedPost._id.toString());
    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: deletedPost,
    });
  } catch (error) {
    logger.warn(`delete post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    res.status(500).json({ success: false, message: message });
  }
};

const updatePost = async (req, res) => {
  logger.info("update post endpoint hit");
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { title, content, mediaUrls } = req.body;

    const postData = await PostModel.findOne({ _id: postId, user: userId });

    if (!postData) {
      logger.warn("Post not found or unauthorized");
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (postData.user.toString() !== userId) {
      logger.warn("Unauthorized to update this post");
      return res.status(401).json({
        success: false,
        message: "Unauthorized to update this post",
      });
    }

    if (title !== undefined) postData.title = title;
    if (content !== undefined) postData.content = content;
    if (mediaUrls !== undefined) postData.mediaUrls = mediaUrls;

    await postData.save();

    await req.redisClient.setex(
      `post:${postId}`,
      300,
      JSON.stringify(postData)
    );

    logger.info("Post updated successfully");
    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: postData,
    });
  } catch (error) {
    logger.warn(`update post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    res.status(500).json({ message: message });
  }
};

const likePostToggle = async (req, res) => {
  logger.info("like toggle endpoint hit");
  try {
    const postId = req.params.id;
    const userId = req.user.userId || req.user._id;

    const postData = await PostModel.findById(postId);
    if (!postData) {
      logger.warn("Post not found");
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const isLiked = postData.likes.some(
      (id) => id.toString() === userId.toString()
    );
    if (isLiked) {
      postData.likes = postData.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      postData.likeCount--;
    } else {
      postData.likes.push(userId);
      postData.likeCount++;
    }

    await postData.save();

    await req.redisClient.setex(
      `post:${postId}`,
      300,
      JSON.stringify(postData)
    );
    await invalidatePostsCache(req, postId);

    if (isLiked) {
      logger.info("Post unliked successfully");
      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
        data: postData,
      });
    }

    logger.info("Post liked successfully");
    return res.status(200).json({
      success: true,
      message: "Post liked successfully",
      data: postData,
    });
  } catch (error) {
    logger.warn(`like post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    res.status(500).json({ message: message });
  }
};

const commentPost = async (req, res) => {
  logger.info("comment post endpoint hit");
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.user.userId || req.user._id;

    const postData = await PostModel.findById(postId);
    if (!postData) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const newComment = new CommentModel({
      user: userId,
      content: content,
    });
    await newComment.save();

    postData.comments.push(newComment._id);
    postData.commentContent.push(newComment.content);
    await postData.save();

    await req.redisClient.setex(
      `post:${postId}`,
      300,
      JSON.stringify(postData)
    );
    await invalidatePostsCache(req, postId);

    logger.info("Post commented successfully");
    return res.status(200).json({
      success: true,
      message: "Post commented successfully",
      data: newComment,
    });
  } catch (error) {
    logger.warn(`comment post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    res.status(500).json({ success: false, message });
  }
};

const deleteCommentPost = async (req, res) => {
  logger.info("delete comment post endpoint hit");
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await CommentModel.findByIdAndDelete(commentId);

    const post = await PostModel.findById(postId);
    if (post) {
      post.comments = post.comments.filter((id) => id.toString() !== commentId);
      await post.save();

      await req.redisClient.setex(`post:${postId}`, 300, JSON.stringify(post));
      await invalidatePostsCache(req, postId);
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    logger.warn(`delete comment post error: ${error.message}`);
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error.message;
    return res.status(500).json({ success: false, message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  likePostToggle,
  commentPost,
  deleteCommentPost,
};
