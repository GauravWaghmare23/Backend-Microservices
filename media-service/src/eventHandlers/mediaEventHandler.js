const MediaModel = require("../models/media.model");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger")

const handlePostDeleted = async (events) => {
    logger.info(`Post deleted event received: ${JSON.stringify(events)}`);
    console.log(events, "events")
    
    try {
        const { postId, mediaIds } = events;

        if (!postId || !mediaIds[0]) {
            logger.error(`Event data not recived`);
        }

        const mediaToDelete = await MediaModel.find({ _id: { $in: mediaIds } });

        for (const media of mediaToDelete) {
            await deleteMediaFromCloudinary(media.publicId);
            await MediaModel.findByIdAndDelete(media._id);
            logger.info(`Media deleted from Cloudinary: ${media.publicId} of the post ${postId}`);
        }
    } catch (error) {
        logger.error(e, "Error occured while media deletion");
    }
}

module.exports = { handlePostDeleted };