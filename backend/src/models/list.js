const mongoose = require ("mongoose");
const listSchema = new mongoose.Schema({userId:{type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true}, name:{type: String, required: true, trim: true}, isPublic:{type: Boolean, default: false}, createdAt:{type:Date, default: Date.now}});
module.exports = mongoose.model("Lists", listSchema);
