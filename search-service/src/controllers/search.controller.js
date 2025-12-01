const SearchModel = require("../models/search.model");
const logger = require("../utils/logger");


async function searchController (req, res) {
    logger.info("search endpoint hit");
    try {
        const { query } = req.query;
        const result = await SearchModel.find({
            $text: {
                $search: query
            }
        },
            {
                score: { $meta: "textScore" }
            },
        ).sort({ score: { $meta: "textScore" } }).limit(10);
        
        res.json(result);
    } catch (error) {
        logger.error(error, "Error occured while searching");
        res.status(500).json({ success: false, message: "error while searching post" });
    }
}

module.exports = {searchController};