const MediaModel = require("../models/media.model.js");
const { uploadMediaToCloudinary } = require("../utils/cloudinary.js");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Upload media endpoint hit");
  try {
    if (!req.file) {
      logger.info("No file uploaded, please upload a file and try again.");
      return res.status(400).json({
        success: false,
        message: "Please upload a file and try again.",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId || req.user._id;

    logger.info(
      `File name: ${originalname}, File type: ${mimetype}, File size: ${buffer.length} bytes`
    );
    logger.info("File upload started......");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      "File uploaded to Cloudinary successfully. Media ID: " +
        cloudinaryUploadResult.public_id +
        ", Media URL: " +
        cloudinaryUploadResult.secure_url
    );

    const newMedia = new MediaModel({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      user: userId,
    });

    await newMedia.save();

    return res.status(200).json({
      success: true,
      media:newMedia,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error(`Error uploading media: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  uploadMedia
};