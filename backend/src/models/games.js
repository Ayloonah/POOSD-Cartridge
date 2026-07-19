const mongoose = require ("mongoose");
const gameSchema = new mongoose.Schema({
    rawgId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    coverImage: {
        type: String
    },
    genres:{
        type:[String],
        default:[]
    },
    platforms:{
        type:[String],
        default: []
    },
    releaseDate: {
        type: Date
    },
    developers: {
        type: [String],
        default: []
    },
    description:{
        type: String
    },
    cachedAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("Game", gameSchema);