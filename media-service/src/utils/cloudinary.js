const cloudinary = require("cloudinary").v2;
const { UploadStream } = require("cloudinary");
const logger = require("./logger.js");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          logger.error(error);
          reject(error);
        } else {
          logger.info(
            `Media uploaded to Cloudinary: URL : ${result.secure_url}, Public ID : ${result.public_id}`
          );
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};
console.log(uploadMediaToCloudinary);

const deleteMediaFromCloudinary = (publicId) => {
  try {
      const result = cloudinary.uploader.destroy(publicId);
      logger.info(`Media deleted from Cloudinary: ${result}, public ID: ${publicId}`);
      return result;
  } catch (error) {
    logger.error(`Error deleting media from Cloudinary: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary
};
