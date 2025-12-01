const express = require("express");
const router = express.Router();
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/auth.middleware.js");
const logger = require("../utils/logger.js");
const {uploadMedia, getAllMedias} = require("../controllers/media.controller.js");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticationMiddleware,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer error while uploading media: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: `Multer error while uploading media: ${err.message}`,
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error(`Unknown error while uploading media: ${err.message}`);
        return res.status(400).json({
          success: false,
          message: `Unknown error while uploading media: ${err.message}`,
          error: err.message,
          stack: err.stack,
        });
      }
      if (!req.file) {
        logger.error("No file uploaded, please upload a file and try again.");
        return res.status(400).json({
          success: false,
          message: "Please upload a file and try again.",
        });
      }
      next();
    });
  },
  uploadMedia
);

router.get("/all-medias", authenticationMiddleware, getAllMedias);


module.exports = router;