const SearchModel = require("../models/search.model");
const logger = require("../utils/logger");

const handlePostCreated = async(events) => {
    logger.info(`Event received at search service : ${events.eventName}`);
    console.log(events, "events")
    try {
        const { postId, userId, content, createdAt } = events;

        const newSearchModel = new SearchModel({
            postId: postId,
            userId: userId,
            content: content,
            createdAt: createdAt
        });
        await newSearchModel.save();
        
        logger.info("Search created successfully", newSearchModel);
        logger.info(`Search created successfully: eventName: ${events.eventName}, postId: ${postId}, userId: ${userId}, content: ${content}, createdAt: ${createdAt}`);

    } catch (error) {
        logger.error(error, "Error occured while media deletion");
    }
}

const handlePostDeleted = async(events) => {
    logger.info(`Event received at search service : ${events.eventName}`);   
    try {
        const { postId } = events;
        await SearchModel.findOneAndDelete({ postId: postId });
        logger.info("Search deleted successfully", postId);
    } catch (error) {
        logger.error(error, "Error occured while search deletion");
    }
}

module.exports = { handlePostCreated };