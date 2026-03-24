const mongoose = require("mongoose")

const CommentSchema = new mongoose.Schema({

 taskId: String,

 text: String,

 userId: String

},{timestamps:true})

module.exports = mongoose.model("Comment", CommentSchema)
