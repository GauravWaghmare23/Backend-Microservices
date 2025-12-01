const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
    postId: {
        type:String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

searchSchema.index({ content: 'text' });
searchSchema.index({ createdAt: -1 });

const SearchModel = mongoose.models.Search || mongoose.model('Search', searchSchema);
module.exports = SearchModel;